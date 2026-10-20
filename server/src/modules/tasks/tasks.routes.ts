import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";

import {
  getProjectTasks,
  postProjectTask,
  patchProjectTask,
  deleteProjectTaskController,
  reorderProjectTasksController,
} from "./tasks.controller.js";

const router = Router();

router.patch(
  "/:projectId/tasks/reorder",
  authenticate,
  reorderProjectTasksController,
);

router.get("/:projectId/tasks", authenticate, getProjectTasks);
router.post("/:projectId/tasks", authenticate, postProjectTask);
router.patch("/:projectId/tasks/:taskId", authenticate, patchProjectTask);
router.delete("/:projectId/tasks/:taskId", authenticate, deleteProjectTaskController);

export default router;