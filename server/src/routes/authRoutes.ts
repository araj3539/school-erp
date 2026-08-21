import { Router } from "express";
import { authenticate, requirePermission, requireRole } from "../middleware/index.js";
import { register, login, refresh, logout, me, changePassword } from "../controllers/authController.js";
import { getUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { UserRole } from "@school-erp/shared";

const router = Router();

router.post("/register", authenticate, requireRole(UserRole.SUPER_ADMIN), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, changePassword);
router.get("/users", authenticate, requirePermission("users:read"), getUsers);
router.get("/users/:id", authenticate, requirePermission("users:read"), getUserById);
router.post("/users", authenticate, requirePermission("users:write"), createUser);
router.put("/users/:id", authenticate, requirePermission("users:write"), updateUser);
router.delete("/users/:id", authenticate, requireRole(UserRole.SUPER_ADMIN), deleteUser);

export default router;
