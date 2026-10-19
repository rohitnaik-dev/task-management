import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, getMe } from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts. Please try again later.",
    },
});

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", authenticate, getMe);

export default router;