import { z } from "zod";

export const actionApprovalSchema = z.object({
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    comments: z.string().optional(),
  }),
});
