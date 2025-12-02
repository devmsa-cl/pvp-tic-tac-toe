import Board from "./board.js";
import Indicator from "./indicator.js";
import Lobby from "./lobby.js";
import Player from "./player.js";
import Popup from "./popup.js";
const socket = io();

socket.on("connect", () => {
  console.log("connected", socket.id);
});

const state = {
  turn: "",
  connected: false,
  room: null,
  mark: "", // X or O
  playerXorO: new Map(),
  players: [],
  gameOver: false,
  score: new Map(),
  inGame: false,
};
const popup = new Popup();
popup.render(document.querySelector("body"));

// popup.show()
class TicTacToe {
  player;
  board;
  constructor(socket, state) {
    this.state = state;
    this.board = new Board(state);
    this.socket = socket;
    this.player = new Player(state, socket);
    this.indicator = new Indicator(state);
    this.root = document.querySelector(".app");
    this.root.appendChild(this.player.root);
    this.root.appendChild(this.board.root);
    this.root.appendChild(this.indicator.root);
    this.root.appendChild(this.player.controller);
  }
  newGame() {
    this.board.clear();
    this.listenUserInput();
    this.switchTurn();
    this.playAgain();
    this.updateBoard();
    this.alertWinner();
    this.alertDraw();
    this.playerLeft();
    this.indicator.updateUI(this.socket.id);
    this.player.updateScoreBoard();
    this.state.inGame = true;
  }
  reset() {
    this.player.showDisplayLoading(false);
    this.board.clear();
    this.state.gameOver = false;
    this.indicator.updateUI(this.socket.id);
  }
  updateBoard() {
    this.socket.on("update-board", ({ cellPosition }) => {
      this.board.markCell(cellPosition);
    });
  }
  playAgain() {
    this.socket.on("play-again", ({ turn }) => {
      this.state.turn = turn;
      popup.hide();
      this.reset();
    });
  }
  playerLeft() {
    this.socket.on("player-left", () => {
      popup.message("Player left");
      window.location.hash = "lobby";
    });
  }
  listenUserInput() {
    this.board.root.addEventListener("click", (e) => {
      if (this.state.turn !== this.socket.id) {
        return;
      }
      if (this.gameOver) return;

      if (e.target.classList.contains("cell")) {
        // already mark
        if (
          e.target.classList.contains("cell-x") ||
          e.target.classList.contains("cell-o")
        ) {
          return;
        }

        const index = Array.from(this.board.root.children).indexOf(e.target); //this.board.cells

        socket.emit("place-cell", {
          cellPosition: index,
          room: state.room,
        });

        this.board.markCell(index, true);
      }
    });
  }
  switchTurn() {
    this.socket.on("switch-turn", (data) => {
      this.state.turn = data.turn;
      this.indicator.updateUI(this.socket.id);
    });
  }
  alertDraw() {
    this.socket.on("draw", () => {
      this.state.gameOver = true;
      popup.message("Draw", 4000);
    });
  }
  alertWinner() {
    this.socket.on("winner", (data) => {
      this.state.gameOver = true;
      this.state.score = new Map(data.score);
      this.player.updateScoreBoard();
      popup.message(
        `${this.socket.id === data.winner ? "You Win" : "Sorry, you lose."}`,
        4000
      );
    });
  }
}

window.addEventListener("hashchange", (e) => {
  if (e.type !== "hashchange") return;

  const hash = window.location.hash.slice(1);
  if (hash == "") return;

  renderPage();
});

if (window.location.hash.slice(1) == "") {
  window.location.hash = "lobby";
} else {
  renderPage();
}

function renderPage() {
  switch (window.location.hash.slice(1)) {
    case "lobby":
      if (state.inGame) {
        state.inGame = false;
        socket.emit("leave-room", { room: state.room });
      }
      document.querySelector(".app").innerHTML = "";
      new Lobby(document.querySelector(".app"), state, socket);
      break;
    case "play":
      if (!state.connected) {
        window.location.hash = "lobby";
        return;
      }
      document.querySelector(".app").innerHTML = "";
      const r = new TicTacToe(socket, state);
      r.newGame();
      break;
  }
}
