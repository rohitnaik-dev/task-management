
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getProjectTasks } from "./tasks.controller.js";

const router = Router();

router.get("/:projectId/tasks",authenticate,getProjectTasks);

export default router;
