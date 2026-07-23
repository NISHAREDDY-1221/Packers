import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import * as validation from "../validations/approval";
import * as controller from "../controllers/approvalController";

const router = Router();

router.use(authenticate);

router.get("/", controller.getApprovals);
router.post(
  "/:id/action",
  validate(validation.actionApprovalSchema),
  controller.processApproval,
);

export default router;
