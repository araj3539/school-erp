import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "../utils/errors.js";

// Express request augmentation requires declaration merging through its namespace.
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, any>;
      validatedBody?: Record<string, any>;
      validatedParams?: Record<string, any>;
    }
  }
}

export type ValidationTarget = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: ValidationTarget = "body") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      if (target === "query") req.validatedQuery = parsed;
      if (target === "body") req.validatedBody = parsed;
      if (target === "params") req.validatedParams = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        next(new AppError(messages.join("; "), 400, "VALIDATION_ERROR"));
      } else {
        next(error);
      }
    }
  };
}
