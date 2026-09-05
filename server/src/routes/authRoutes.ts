import { Router, type RequestHandler } from "express";
import { authenticate, requirePermission, requireRole, validate } from "../middleware/index.js";
import { register, login, refresh, logout, me, changePassword } from "../controllers/authController.js";
import { getUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { CreateUserSchema, UpdateTenantUserSchema, IdParamSchema } from "../validators/index.js";
import { UserRole } from "@school-erp/shared";

const router = Router();
const mobileAuth: RequestHandler = (_req, res, next) => {
  res.locals.mobileAuth = true;
  next();
};

router.post("/register", authenticate, requireRole(UserRole.SUPER_ADMIN), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/mobile/login", mobileAuth, login);
router.post("/mobile/refresh", mobileAuth, refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, changePassword);
router.get("/users", authenticate, requirePermission("users:read"), getUsers);
router.get("/users/:id", authenticate, requirePermission("users:read"), validate(IdParamSchema, "params"), getUserById);
router.post("/users", authenticate, requirePermission("users:write"), validate(CreateUserSchema), createUser);
router.put("/users/:id", authenticate, requirePermission("users:write"), validate(IdParamSchema, "params"), validate(UpdateTenantUserSchema), updateUser);
router.delete("/users/:id", authenticate, requireRole(UserRole.SUPER_ADMIN), validate(IdParamSchema, "params"), deleteUser);

export default router;
