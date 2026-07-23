import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { sendResponse } from "../utils/response";

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendResponse(
          res,
          400,
          "Validation Failed",
          (error as any).errors || (error as any).issues,
        );
      }
      return next(error);
    }
  };
};
