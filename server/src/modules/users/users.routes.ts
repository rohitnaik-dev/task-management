import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRole } from "../../middleware/authorizeRole.js";
import { listUsers, changeUserRole } from "./users.controller.js";

const router = Router();

router.use(authenticate, authorizeRole("admin"));

router.get("/", listUsers);
router.patch("/:id/role", changeUserRole);

export default router;