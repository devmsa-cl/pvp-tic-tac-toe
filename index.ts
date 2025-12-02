import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { WsHandler } from "./ws.js";
const app = express();
const server = createServer(app);

WsHandler(new Server(server));

const port = 3000;

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

export default server;
