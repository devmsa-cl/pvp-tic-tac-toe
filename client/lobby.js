export default class Lobby {
  root;
  isLoading = false;
  socket;
  state;
  constructor(el, state, socket) {
    this.root = el;
    this.state = state;
    this.socket = socket;
    this.root.appendChild(this.#markup());
    this.form = this.root.querySelector(".form");

    this.#loadUsername();

    this.onSearch();
    this.onJoin();
  }

  onJoin() {
    this.isLoading = false;
    this.root.querySelector(".searching-spinning").innerHTML = "";
  }
  onSearch() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.isLoading = true;
      this.#displayLoadingScreen();
      const input = this.form.querySelector("input");
      let username = input.value;
      if (username === "") {
        username = "Anonymous";
      } else {
        this.#saveUsername(username);
      }

      this.socket.emit("search-for-player", username);
      this.socket.on("gameStart", (data) => {
        for (const [key, value] of data.playerXorO) {
          this.state.playerXorO.set(key, value);
        }
        this.state.score = new Map(data.score);
        this.state.room = data.room;
        this.state.players = data.players;
        this.state.connected = true;
        this.state.turn = data.turn;
        this.state.mark = this.state.playerXorO.get(this.socket.id);
        window.location.hash = `play`;
      });
    });
  }
  #displayLoadingScreen() {
    if (this.isLoading) {
      this.root.querySelector(".searching-spinning").innerHTML = `
         <p>Search</p>
          <span
            class="h-6 w-6 inline-block rounded-full border-4 border-zinc-200 border-t-zinc-500 animate-spin"
          ></span>`;
    }
  }

  // Storage username in local storage
  #saveUsername(name) {
    localStorage.setItem("username", name);
  }
  // Load username from local storage
  #loadUsername() {
    const input = this.form.querySelector("input");
    const local = localStorage.getItem("username");
    input.value = local == "" || local == "Anonymous" ? local == "" : local;
  }

  #markup() {
    const fragment = document.createDocumentFragment();
    const lobby = document.createElement("div");
    lobby.className = "lobby m-8";
    lobby.innerHTML = `
    <h1 class="text-white text-4xl mb-4 leading-tight tracking-wider">
          Lobby Room
        </h1>
        <form class="form">
          <input
            class="join-input bg-white px-4 py-2 rounded-md cursor-pointer hover:bg-slate-200 transition duration-200"
            type="text"
            placeholder="Username"
          />
          <button
            class="join-btn bg-white px-4 py-2 my-2 rounded-md cursor-pointer hover:bg-slate-200 transition duration-200"
          >
            Join Room
          </button>
        </form>
        <div class="searching-spinning my-4 text-white flex gap-2 item-center">

        </div>
    `;
    fragment.appendChild(lobby);
    return fragment;
  }
}
