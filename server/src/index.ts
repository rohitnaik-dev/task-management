import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js"
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

const port = Number(process.env.PORT ?? 5000);

async function startServer() {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        console.log("Database connected:", result.rows[0].current_time);

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
       console.error("Failed to start the server:", error);
       process.exit(1); 
    }
}

startServer();