import { WebSocketServer } from "ws";
import config from "./config.js";

const wss = new WebSocketServer({
  host: config.websocket.host,
  port: config.websocket.port,
});

wss.on("error", (error) => {
  console.log("Websocket-ERROR:", error);
});

wss.on("listening", () => {
  console.log("Websocket server is running on:", wss.address());
});

export default wss;
