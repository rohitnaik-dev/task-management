
import type { UserRole } from "../modules/auth/auth.service.js";

export type SocketUser = {
  id: string;
  role: UserRole;
};
