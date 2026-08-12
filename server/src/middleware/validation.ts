import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodRawShape } from "zod";
import { AppError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: Record<string, any>;
      validatedBody?: Record<string, any>;
      validatedParams?: Record<string, any>;
    }
  }
}

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      req.validatedQuery = parsed.query;
      req.validatedBody = parsed.body;
      req.validatedParams = parsed.params;
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

