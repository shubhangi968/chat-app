import { io } from "socket.io-client";

const token = localStorage.getItem("token");

const socket = io(process.env.REACT_APP_API_URL, {
  transports: ["websocket"],
  autoConnect: true,

  auth: {
    token,
  },
});

export default socket;