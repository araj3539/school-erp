import { Router } from "express";
import { authenticate, requireRole } from "../middleware";
import { register, login, refresh, logout, me, changePassword } from "../controllers/authController";
import { getUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController";
import { UserRole } from "../shared-types";

const router = Router();

router.post("/register", authenticate, requireRole(UserRole.SUPER_ADMIN), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, changePassword);
router.get("/users", authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL), getUsers);
router.get("/users/:id", authenticate, requireRole(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL), getUserById);
router.post("/users", authenticate, requireRole(UserRole.SUPER_ADMIN), createUser);
router.put("/users/:id", authenticate, requireRole(UserRole.SUPER_ADMIN), updateUser);
router.delete("/users/:id", authenticate, requireRole(UserRole.SUPER_ADMIN), deleteUser);

export default router;
