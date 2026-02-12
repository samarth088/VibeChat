import { ENV } from "../../config/env.js";
import { State } from "./state.js";

let socket = null;

export function initSocket() {
  if (!State.user) return;

  socket = io(ENV.SOCKET_URL, {
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    console.log("🟢 Socket Connected");
    socket.emit("register", State.user.id);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected");
  });
}

export function getSocket() {
  return socket;
}
