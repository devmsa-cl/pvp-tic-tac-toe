import type { Server, Socket } from "socket.io";
import randomstring from "randomstring";
const winCombo = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
type GameRoom = {
  players: Set<string>;
  placedCells: Array<number>;
  currentTurn: string;
  playerXorO: Map<string, "X" | "O">;
  board: Array<string>;
  room: string;
  inGame: boolean;
  playAgain: Set<string>;
  score: Map<string, number>;
};

type PlaceCellData = {
  room: string;
  cellPosition: number;
};

const users = new Set();
const lobby = new Map<string, Date>();
const gameRoom = new Map<string, GameRoom>();
export const WsHandler = (io: Server) => {
  io.on("connection", (socket) => {
    addUser(socket.id);
    socket.emit("success", {
      msg: "Connected",
    });

    socket.on("disconnect", () => {
      removeUser(socket.id);
      removeRoom(io, socket.id);
      lobby.delete(socket.id);
      // notification user leave
    });

    socket.on("search-for-player", () => {
      searchPlayer(io, socket);
    });

    socket.on("play-again", (data) => {
      playAgain(io, socket, data);
    });

    socket.on("leave-room", ({ room }) => {
      const currentRoom = gameRoom.get(room);
      if (!currentRoom) return;

      socket.leave(room);

      const roomSockets = io.sockets.adapter.rooms.get(room);
      if (!roomSockets) return;

      for (const socketId of roomSockets) {
        const socketInRoom = io.sockets.sockets.get(socketId);
        if (socketInRoom) {
          socketInRoom.leave(room);
          socketInRoom.emit("player-left");
        }
      }

      gameRoom.delete(currentRoom.room);
    });

    socket.on("place-cell", (data: PlaceCellData) => {
      // check if room exits
      if (!gameRoom.has(data.room)) return; // not room

      const room = gameRoom.get(data.room)!;

      // No in the game
      if (!room.inGame) return;
      // is player turn;
      if (room.currentTurn !== socket.id) return;

      // make sure cell not marked already
      if (room.placedCells.includes(data.cellPosition)) return;

      // add the new cell
      room.placedCells.push(data.cellPosition);

      // mark the cell
      room.board[data.cellPosition] = room.playerXorO.get(socket.id)!;

      const [winner, combo] = checkWinner(
        room.board,
        room.playerXorO.get(socket.id)!
      );

      if (winner) {
        // game over
        room.inGame = false;
        const nextPlayer = getNextPlayer(room.currentTurn, room.players);

        room.currentTurn = nextPlayer;

        const playerSocket = io.sockets.sockets.get(nextPlayer);

        if (playerSocket) {
          playerSocket.emit("update-board", {
            cellPosition: data.cellPosition,
          });
        }

        // if we win, set the winner start first
        room.currentTurn = socket.id;

        // update the score
        room.score.set(socket.id, (room.score.get(socket.id) || 0) + 1);

        // emit game over and announce winner
        io.to(room.room).emit("winner", {
          score: Array.from(room.score),
          combo: combo,
          room: data.room,
          winner: socket.id,
        });
      } else if (!winner && room.placedCells.length >= 9) {
        const nextPlayer = getNextPlayer(room.currentTurn, room.players);
        updateNextPlayerBoard(io, nextPlayer, data.cellPosition);
        // draw
        room.inGame = false;
        io.to(room.room).emit("draw", {
          room: data.room,
        });
      } else {
        switchTurn(io, socket, room, data);
      }
    });
  });
};
function switchTurn(
  io: Server,
  socket: Socket,
  room: GameRoom,
  data: PlaceCellData
) {
  // switch turn
  const nextPlayer = getNextPlayer(room.currentTurn, room.players);

  room.currentTurn = nextPlayer;

  io.to(room.room).emit("switch-turn", {
    turn: nextPlayer,
  });
  updateNextPlayerBoard(io, nextPlayer, data.cellPosition);
}
function playAgain(io: Server, socket: Socket, data: { room: string }) {
  if (!gameRoom.has(data.room)) return;
  const room = gameRoom.get(data.room)!;

  if (room.inGame) return;

  if (!room.playAgain.has(socket.id)) {
    room.playAgain.add(socket.id);
  }

  if (room.playAgain.size === 2) {
    // clear the board
    room.placedCells = [];
    room.board = ["#", "#", "#", "#", "#", "#", "#", "#", "#"];
    room.inGame = true;

    const playerNext = getNextPlayer(room.currentTurn, room.players);
    room.currentTurn = playerNext;

    io.to(room.room).emit("play-again", {
      room: data.room,
      turn: room.currentTurn,
    });

    // clear the playAgain
    room.playAgain.clear();
  }
}
function checkWinner(board: string[], mark: string): [boolean, Array<number>] {
  for (let combination of winCombo) {
    const [a, b, c] = combination;
    if (board[a!] === mark && board[b!] === mark && board[c!] === mark) {
      return [true, combination];
    }
  }
  return [false, []];
}

function searchPlayer(io: Server, socket: Socket) {
  // no player found yet. wait in lobby
  if (lobby.has(socket.id)) return; // self in the lobby
  if (lobby.size == 0) {
    lobby.set(socket.id, new Date());
  } else if (lobby.size > 0) {
    // join with the lobby user
    let nextPlayer = "";
    let now = new Date();

    for (const [key, value] of lobby.entries()) {
      if (value < now) {
        nextPlayer = key;
        now = value;
      }
    }

    if (nextPlayer == "") return;
    const room = randomstring.generate(7);

    // remove the joined play from lobby
    lobby.delete(nextPlayer);

    gameRoom.set(room, {
      players: new Set([socket.id, nextPlayer]),
      board: ["#", "#", "#", "#", "#", "#", "#", "#", "#"],
      playAgain: new Set(),
      placedCells: [],
      currentTurn: socket.id,
      inGame: true,
      score: new Map([
        [socket.id, 0],
        [nextPlayer, 0],
      ]),
      playerXorO: new Map([
        [socket.id, "X"],
        [nextPlayer, "O"],
      ]),
      room: room,
    });

    for (const playerId of gameRoom.get(room)!.players) {
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.join(room);
      }
    }

    io.to(room).emit("gameStart", {
      room,
      turn: socket.id,
      score: Array.from(gameRoom.get(room)!.score),
      players: Array.from(gameRoom.get(room)!.players),
      playerXorO: Array.from(gameRoom.get(room)!.playerXorO),
    });
  }
}
function addUser(socketId: string) {
  users.add(socketId);
}
function removeUser(socketId: string) {
  users.delete(socketId);
  lobby.delete(socketId);
}
function removeRoom(io: Server, socketId: string) {
  let game = null;
  for (const [_, room] of gameRoom) {
    if (room.players.has(socketId)) {
      game = room;
    }
  }
  if (game) {
    gameRoom.delete(game.room);
    for (const playerId of game.players) {
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.leave(game.room);
        playerSocket.emit("player-left");
      }
    }
  }
}

function getNextPlayer(currentPlayer: string, players: Set<string>): string {
  const p = Array.from(players).filter((p) => p !== currentPlayer);
  return p[0]!;
}

// update the next player
function updateNextPlayerBoard(
  io: Server,
  nextPlayer: string,
  cellPosition: number
) {
  const playerSocket = io.sockets.sockets.get(nextPlayer);

  if (playerSocket) {
    playerSocket.emit("update-board", {
      cellPosition: cellPosition,
    });
  }
}
