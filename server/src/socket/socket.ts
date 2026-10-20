
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { authenticateSocket } from "./socket.auth.js";
import type { SocketUser } from "./socket.types.js";

import { authorizeProjectRoom, getProjectRoomName, ProjectRoomForbiddenError, ProjectRoomNotFoundError } from "./socket.rooms.js";


function isValidProjectId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  

  // Authenticate every incoming socket connection.
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);

      socket.data.user = user;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });


io.on("connection", (socket) => {
  const user = socket.data.user as SocketUser;

  void socket.join(`user:${user.id}`);

  console.log(
    `Socket connected: ${socket.id}, user: ${user.id}`,
  );

  socket.on(
    "join_project",
    async (
      projectId: unknown,
      acknowledge?: (response: {
        ok: boolean;
        message?: string;
        room?: string;
      }) => void,
    ) => {
      // Require a valid project ID and acknowledgement callback.
     if (
  typeof projectId !== "string" ||
  !isValidProjectId(projectId) ||
  typeof acknowledge !== "function"
) {
  if (typeof acknowledge === "function") {
    acknowledge({
      ok: false,
      message: "Invalid project ID",
    });
  }
  return;
}

      const room = getProjectRoomName(projectId);

      try {
        // Verify project access before joining the room.
        await authorizeProjectRoom(user, projectId);

        await socket.join(room);

        acknowledge({
          ok: true,
          room,
        });

        console.log(
          `User ${user.id} joined ${room}`,
        );
      } catch (error: unknown) {
        if (error instanceof ProjectRoomNotFoundError) {
          acknowledge({
            ok: false,
            message: "Project not found",
          });
          return;
        }

        if (error instanceof ProjectRoomForbiddenError) {
          acknowledge({
            ok: false,
            message: "You do not have access to this project",
          });
          return;
        }

        console.error("Failed to join project room:", error);

        acknowledge({
          ok: false,
          message: "Unable to join project room",
        });
      }
    },
  );

  socket.on(
    "leave_project",
    (
      projectId: unknown,
      acknowledge?: (response: {
        ok: boolean;
        message?: string;
      }) => void,
    ) => {
      if (
  typeof projectId !== "string" ||
  !isValidProjectId(projectId) ||
  typeof acknowledge !== "function"
) {
  if (typeof acknowledge === "function") {
    acknowledge({
      ok: false,
      message: "Invalid project ID",
    });
  }
  return;
}

      const room = getProjectRoomName(projectId);

      void socket.leave(room);

      acknowledge({ ok: true });
    },
  );

  socket.on("disconnect", (reason) => {
    console.log(
      `Socket disconnected: ${socket.id}, reason: ${reason}`,
    );
  });
});


  return io;
}
