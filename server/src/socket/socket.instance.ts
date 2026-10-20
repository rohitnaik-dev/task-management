
import type { Server } from "socket.io";

let io: Server | undefined;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}

export function revokeProjectMemberAccess(
  projectId: string,
  userId: string,
): void {
  const room = `project:${projectId}`;
  const userRoom = `user:${userId}`;

  getSocketServer()
    .in(userRoom)
    .socketsLeave(room);
}


export function revokeProjectRoomAccess(
  projectId: string,
): void {
  getSocketServer()
    .in(`project:${projectId}`)
    .socketsLeave(`project:${projectId}`);
}

export function disconnectUserSockets(
  userId: string,
): void {
  getSocketServer()
    .in(`user:${userId}`)
    .disconnectSockets(true);
}
