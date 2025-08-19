import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

export const getMessages = (chatId) => API.get(`/messages/${chatId}`);
export const sendMessage = (messageData) => API.post(`/messages`, messageData);
