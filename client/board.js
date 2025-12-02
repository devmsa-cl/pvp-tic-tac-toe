export default class Board {
  root;

  constructor(state) {
    this.state = state;
    this.root = document.createElement("div");
    this.root.classList =
      "board grid grid-cols-3 grid-rows-3 gap-1 p-1 gap-2 relative z-30 w-[312px] h-[312px]";

    this.root.appendChild(this.#html());

    this.cells = this.root.querySelectorAll(".cell");
  }

  clear() {
    this.cells.forEach((cell) => {
      cell.classList.remove("cell-x");
      cell.classList.remove("cell-o");
      cell.classList.remove("matched");
    });
  }
  highlightCells(combo) {
    combo.forEach((cell) => {
      this.cells[cell].classList.add("matched");
    });
  }
  markCell(position, self = false) {
    let m = "";
    if (!self) {
      m = this.state.mark === "X" ? "cell-o" : "cell-x";
    } else {
      m = this.state.mark === "X" ? "cell-x" : "cell-o";
    }
    this.cells[position].classList.add(m);
  }
  #html() {
    const fragment = document.createDocumentFragment("div");
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.classList =
        "cell w-24 h-24 bg-slate-300 rounded-lg hover:bg-slate-400 transition duration-200 cursor-pointer grid place-content-center";
      fragment.appendChild(cell);
    }
    return fragment;
  }
}
