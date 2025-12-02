export default class Indicator {
  constructor(state) {
    this.state = state;
    this.root = this.#markup();
  }
  updateUI(socketId) {
    this.root.innerHTML = `
    <h1 class="text-white lg:text-2xl mb-4 leading-tight tracking-wider text-lg font-light">
        ${socketId == this.state.turn ? "Your Turn" : "Opponent Turn"}
    </h1>
    <h3 class="text-white">You are \"${this.state.mark}\"</h3>
    `;
  }
  #markup() {
    const div = document.createElement("div");
    div.classList =
      "turn-indicator lg:absolute lg:top-1/4 z-20 my-4 text-center";
    return div;
  }
}
