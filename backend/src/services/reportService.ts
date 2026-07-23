import { prisma } from "../utils/prisma";

export class ReportService {
  static async getProductionYield(startDate: Date, endDate: Date) {
    const completedWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        productId: true,
        requiredQty: true,
        actualProduced: true,
        actualRejected: true,
        product: {
          select: { name: true, sku: true },
        },
      },
    });

    // Group by product and calculate yield
    const yieldReport = completedWorkOrders.reduce((acc: any, wo: any) => {
      const pid = wo.productId;
      if (!acc[pid]) {
        acc[pid] = {
          productName: wo.product.name,
          sku: wo.product.sku,
          totalRequired: 0,
          totalProduced: 0,
          totalRejected: 0,
        };
      }
      acc[pid].totalRequired += wo.requiredQty;
      acc[pid].totalProduced += wo.actualProduced || 0;
      acc[pid].totalRejected += wo.actualRejected || 0;
      return acc;
    }, {});

    // Calculate percentages
    Object.values(yieldReport).forEach((item: any) => {
      item.yieldPercentage =
        item.totalRequired > 0
          ? ((item.totalProduced / item.totalRequired) * 100).toFixed(2) + "%"
          : "0%";
      item.rejectRate =
        item.totalProduced + item.totalRejected > 0
          ? (
              (item.totalRejected / (item.totalProduced + item.totalRejected)) *
              100
            ).toFixed(2) + "%"
          : "0%";
    });

    return Object.values(yieldReport);
  }

  static async getQcSummary(startDate: Date, endDate: Date) {
    const qcResults = await prisma.qualityCheck.groupBy({
      by: ["result", "severity"],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    return qcResults;
  }
}
