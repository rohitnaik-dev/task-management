import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js"
import { createServer } from "node:http";
import { initializeSocket } from "./socket/socket.js";
import { setSocketServer } from "./socket/socket.instance.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import projectsRoutes from "./modules/projects/projects.routes.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
const app = express();


app.use(
    cors({
        origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/projects", tasksRoutes);


app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "Task Management API is running",
    });
});

app.use((_req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});

// Global error handler to ensure JSON responses and prevent unhandled crashes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    const status = typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : 500;
    res.status(status).json({
        message: err.message || "Internal server error",
    });
});

const port = Number(process.env.PORT ?? 5000);


const httpServer = createServer(app);
const io = initializeSocket(httpServer);

setSocketServer(io);

async function startServer() {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time",
    );

    console.log(
      "Database connected:",
      result.rows[0].current_time,
    );

    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log("Socket.IO initialized");
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    await pool.end();
    process.exit(1);
  }
}

startServer();
