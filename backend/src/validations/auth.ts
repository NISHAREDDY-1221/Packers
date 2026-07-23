import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name is required"),
    roleName: z.enum(["ADMIN", "MANAGER", "OPERATOR", "QC_INSPECTOR"], {
      message:
        "roleName must be one of ADMIN, STORE MANAGER, PACKING OPERATOR, or QC_INSPECTOR.",
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});
