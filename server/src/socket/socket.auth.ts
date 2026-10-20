
import type { Socket } from "socket.io";
import {
  AuthError,
  findUserById,
  verifyAccessToken,
} from "../modules/auth/auth.service.js";

import type { SocketUser } from "./socket.types.js";

export async function authenticateSocket(
  socket: Socket,
): Promise<SocketUser> {
  const token = socket.handshake.auth?.token;

  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Authentication required");
  }

  try {
    const userId = verifyAccessToken(token);
    const user = await findUserById(userId);

    if (!user) {
      throw new Error("Invalid or expired token");
    }

    return {
      id: user.id,
      role: user.role,
    };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      throw new Error(error.message);
    }

    throw error;
  }
}
