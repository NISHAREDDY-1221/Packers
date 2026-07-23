import { prisma } from "../utils/prisma";
import { AppError } from "../middlewares/error";
import { APIFeatures } from "../utils/apiFeatures";

export class WorkOrderService {
  static async createWorkOrder(data: {
    productId: string;
    recipeId: string;
    requiredQty: number;
    priority: any;
    expectedDate?: Date;
    supervisorId: string;
  }) {
    // Validate recipe and product match
    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
    });
    if (!recipe) throw new AppError(404, "Recipe not found");
    if (recipe.outputProductId !== data.productId)
      throw new AppError(400, "Recipe does not produce the specified product");

    const woNumber = `WO-${Date.now().toString().slice(-6)}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        productId: data.productId,
        recipeId: data.recipeId,
        requiredQty: data.requiredQty,
        priority: data.priority,
        expectedDate: data.expectedDate,
        supervisorId: data.supervisorId,
        status: "DRAFT",
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: data.supervisorId,
        action: "CREATE_WORK_ORDER",
        entity: "WorkOrder",
        entityId: workOrder.id,
        newData: JSON.parse(JSON.stringify(workOrder)),
      },
    });

    return workOrder;
  }

  static async getWorkOrders(queryString: any = {}) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(["woNumber", "batchNumber"])
      .sort()
      .paginate();

    apiFeatures.query = {
      ...apiFeatures.query,
      include: {
        product: true,
        recipe: {
          include: {
            items: {
              include: {
                inputProduct: true,
              },
            },
          },
        },
        supervisor: true,
      },
    };

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany(apiFeatures.query),
      prisma.workOrder.count({ where: apiFeatures.query.where }),
    ]);

    return { data: workOrders, total, page: apiFeatures.queryString.page || 1 };
  }

  static async updateWorkOrderStatus(id: string, status: any, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError(404, "Work Order not found");

    // Enforce basic state machine validation for simple transitions
    if (
      status === "APPROVED" &&
      workOrder.status !== "PENDING" &&
      workOrder.status !== "DRAFT"
    ) {
      throw new AppError(400, "Can only approve DRAFT or PENDING work orders");
    }

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE_WO_STATUS",
        entity: "WorkOrder",
        entityId: updatedWO.id,
        oldData: { status: workOrder.status },
        newData: { status: updatedWO.status },
      },
    });

    if (status === "PENDING" && workOrder.status !== "PENDING") {
      await prisma.approvalRequest.create({
        data: {
          type: "WORK_ORDER",
          relatedEntityId: updatedWO.id,
          relatedEntityName: `Work Order #${updatedWO.woNumber}`,
          requestedById: userId,
          reason: "Submit for approval",
          priority: updatedWO.priority as any,
          status: "PENDING",
        },
      });
    }

    return updatedWO;
  }

  static async issueMaterials(id: string, payload: any, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError(404, "Work Order not found");

    if (workOrder.status !== "APPROVED") {
      throw new AppError(
        400,
        "Materials can only be issued for APPROVED Work Orders",
      );
    }

    const issueNo = `MI-${Date.now().toString().slice(-6)}`;

    return await prisma.$transaction(async (tx: any) => {
      const issue = await tx.materialIssue.create({
        data: {
          issueNo,
          woId: id,
          issuedById: userId,
          status: "ISSUED",
          payload,
        },
      });

      const updatedWO = await tx.workOrder.update({
        where: { id },
        data: { status: "MATERIAL_ISSUED" },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: "ISSUE_MATERIALS",
          entity: "WorkOrder",
          entityId: updatedWO.id,
          newData: { status: updatedWO.status, issueNo },
        },
      });

      return { issue, updatedWO };
    });
  }

  static async startPacking(id: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError(404, "Work Order not found");

    if (workOrder.status !== "MATERIAL_ISSUED") {
      throw new AppError(
        400,
        "Cannot start packing unless materials are issued",
      );
    }

    const batchNumber = `BATCH-${workOrder.woNumber}-${Date.now().toString().slice(-4)}`;

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "PACKING_STARTED",
        startedAt: new Date(),
        batchNumber, // Assign batch number/barcode during packing execution
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "START_PACKING",
        entity: "WorkOrder",
        entityId: updatedWO.id,
        newData: { status: updatedWO.status, batchNumber },
      },
    });

    return updatedWO;
  }

  static async completePacking(
    id: string,
    actualProduced: number,
    actualRejected: number,
    userId: string,
  ) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError(404, "Work Order not found");

    if (workOrder.status !== "PACKING_STARTED") {
      throw new AppError(
        400,
        "Cannot complete packing for an unstarted or already completed job",
      );
    }

    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        status: "QC_PENDING",
        actualProduced,
        actualRejected,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: "COMPLETE_PACKING",
        entity: "WorkOrder",
        entityId: updatedWO.id,
        newData: { status: updatedWO.status, actualProduced, actualRejected },
      },
    });

    return updatedWO;
  }
}
