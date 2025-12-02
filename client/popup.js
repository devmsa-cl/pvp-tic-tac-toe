export default class Popup {
  isShow = false;
  #root;
  #el;
  constructor() {
    this.isShow = false;
    this.#root = this.#markup();
  }
  message(message, ms = 3000) {
    this.#root.innerHTML = "";
    this.#root.appendChild(this.#item(message));
    this.#el = this.#root.querySelector(".message");
    this.show();
    setTimeout(() => {
      if (!this.isShow) return;
      this.hide();
    }, ms + 100);
  }

  render(el) {
    el.appendChild(this.#root);
  }
  show() {
    this.isShow = true;
    this.#root.classList.remove("hidden");
    this.#transitionStartFade();
  }
  hide() {
    this.isShow = false;
    this.#transitionFadeAway();
  }
  #transitionFadeAway() {
    setTimeout(() => {
      this.#el.classList.add("-translate-y-[200px]");
      this.#el.classList.remove("translate-y-[0px]");
    }, 100);
    setTimeout(() => {
      this.#root.classList.add("hidden");
    }, 750);
  }

  #transitionStartFade() {
    setTimeout(() => {
      this.#el.classList.add("translate-y-[0px]");
      this.#el.classList.remove("-translate-y-[200px]");
    }, 100);
  }
  #item(ed) {
    const item = document.createElement("div");
    item.classList =
      "message text-white bg-slate-900 p-4 rounded-md w-68 text-center absolute -translate-y-[200px] transition-all duration-750 ease-in-out";
    item.innerHTML = ed;
    return item;
  }
  #markup() {
    const popup = document.createElement("div");
    popup.classList =
      "popup fixed top-0 left-0 right-0  h-24 z-40 grid place-items-center hidden";
    return popup;
  }
}
