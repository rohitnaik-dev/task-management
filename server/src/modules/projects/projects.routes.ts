import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRole } from "../../middleware/authorizeRole.js";
import { createProjectController, listProjectsController, getProjectController, updateProjectController, deleteProjectController, listProjectMembersController, addProjectMemberController, removeProjectMemberController } from "./projects.controller.js";

const router = Router();

router.use(authenticate);
router.post("/", createProjectController);
router.get("/", listProjectsController);
router.get("/:projectId", getProjectController);
router.patch("/:projectId", authorizeRole("admin"), updateProjectController);
router.delete("/:projectId", authorizeRole("admin"), deleteProjectController);
router.get("/:projectId/members",listProjectMembersController,);

router.post("/:projectId/members",authorizeRole("admin"), addProjectMemberController);

router.delete("/:projectId/members/:userId",authorizeRole("admin"),removeProjectMemberController);

export default router;