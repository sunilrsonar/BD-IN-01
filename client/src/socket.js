import { io } from "socket.io-client";

function getDefaultServerUrl() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return undefined;
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname || "localhost";

  return `${protocol}//${hostname}:5000`;
}

// In development, connect to the same machine serving the page so mobile devices work too.
const DEFAULT_SERVER_URL = getDefaultServerUrl();
const SERVER_URL = import.meta.env.VITE_SERVER_URL || DEFAULT_SERVER_URL;
const socket = io(SERVER_URL);

export default socket;
