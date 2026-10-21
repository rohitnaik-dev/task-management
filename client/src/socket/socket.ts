import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

export type SocketStatus = "connected" | "connecting" | "disconnected";

let socketInstance: Socket | null = null;

export function getSocketBaseUrl(): string {
  const configured =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";
  return configured.replace(/\/+$/, "").replace(/\/api$/, "");
}

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = getSocketBaseUrl();
    socketInstance = io(url, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: (cb) => {
        const token = localStorage.getItem("auth_token") || "";
        cb({ token });
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socketInstance;
}

export function connectSocket(): Socket {
  const socket = getSocket();
  const token = localStorage.getItem("auth_token");

  if (!token) {
    if (socket.connected) {
      socket.disconnect();
    }
    return socket;
  }

  
  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}

export function useSocketStatus(): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return "disconnected";
    const s = getSocket();
    if (s.connected) return "connected";
    return s.active ? "connecting" : "disconnected";
  });

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => {
      setStatus(socket.active ? "connecting" : "disconnected");
    };
    const onReconnectAttempt = () => setStatus("connecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  return status;
}
