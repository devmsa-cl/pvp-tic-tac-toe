export default class Player {
  root;
  textUI = "Player Turn: ";
  playBtn;
  constructor(state, socket) {
    this.state = state;
    this.socket = socket;
    this.root = this.#markup();
    this.controller = this.#controllerMarkup();
    this.playBtn = this.controller.querySelector(".play-again");
    this.leaveBtn = this.controller.querySelector(".leave-btn");
    this.playerScore = this.root.querySelector(".player-score");
    this.opponentScore = this.root.querySelector(".opponent-score");
    this.onPlayClick();
    this.onLeaveClick();
  }
  onLeaveClick() {
    this.leaveBtn.addEventListener("click", () => {
      this.socket.emit("leave-room", { room: this.state.room });
      window.location.hash = "lobby";
    });
  }
  onPlayClick() {
    this.playBtn.addEventListener("click", () => {
      if (this.state.gameOver) {
        this.showDisplayLoading(true);
      }
      this.socket.emit("play-again", { room: this.state.room });
    });
  }
  updateScoreBoard() {
    this.playerScore.textContent = this.state.score.get(this.socket.id);
    const opponentScore = this.state.score.get(
      Array.from(this.state.players).filter((p) => p !== this.socket.id)[0]
    );
    this.opponentScore.textContent = opponentScore;
  }

  showDisplayLoading(value = true) {
    if (value) {
      this.controller.querySelector(".searching-spinning").innerHTML = `
           <p>Waiting for the other player</p>
            <span
              class="h-6 w-6 inline-block rounded-full border-4 border-zinc-200 border-t-zinc-500 animate-spin"
            ></span>`;
    } else {
      this.controller.querySelector(".searching-spinning").innerHTML = "";
    }
  }

  #controllerMarkup() {
    const d = document.createElement("div");
    d.classList = "player-control lg:top-5/6 lg:absolute z-30";
    d.innerHTML = `
        <div class="searching-spinning my-2 text-white flex gap-2 item-center text-center">
        </div>
      <div class="flex flex-col gap-2">
      <button
          class="play-again bg-white px-4 py-2 rounded-md cursor-pointer hover:bg-slate-200 transition duration-200"
        >
          Play Again
        </button>
        <button
          class="leave-btn bg-white px-4 py-2 rounded-md cursor-pointer hover:bg-slate-200 transition duration-200"
        >
          Leave
        </button>
      </div>
        `;
    return d;
  }
  #markup() {
    const div = document.createElement("div");
    div.classList =
      "player lg:absolute flex my-4 w-screen justify-between z-30";
    div.innerHTML = `<div class="me grid place-items-center px-10">
          <div class="score text-center">
            <h1 class="text-white lg:text-2xl mb-4 leading-tight tracking-wider text-md">
              You
            </h1>
            <p class="text-white text-4xl font-bold player-score text-2xl">0</p>
          </div>
        </div>
        <div class="grid place-items-center px-10">
          <div class="score text-center">
           <h1 class="text-white lg:text-2xl mb-4 leading-tight tracking-wider text-md">
              Opponent
            </h1>
            <p class="text-white text-4xl font-bold opponent-score text-2xl">0</p>
          </div>
        </div>`;
    return div;
  }
}
