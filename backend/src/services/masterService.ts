import { prisma } from '../utils/prisma';
import { APIFeatures } from '../utils/apiFeatures';
import { AppError } from '../middlewares/error';

export class CategoryService {
  static async create(data: { name: string; description?: string }) {
    return prisma.category.create({ data });
  }

  static async update(id: string, data: { name?: string; description?: string }) {
    const { name, description } = data;
    return prisma.category.update({ where: { id }, data: { name, description } });
  }

  static async toggleStatus(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError(404, 'Category not found');
    return prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive }
    });
  }

  static async delete(id: string) {
    const categoryCount = await prisma.product.count({ where: { categoryId: id } });
    if (categoryCount > 0) {
      throw new AppError(400, 'This category cannot be deleted because it is currently assigned to one or more products.');
    }
    return prisma.category.delete({ where: { id } });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['name', 'description'])
      .sort()
      .paginate();

    apiFeatures.query = { ...apiFeatures.query, include: { _count: { select: { products: true } } } };

    const [categories, total] = await Promise.all([
      prisma.category.findMany(apiFeatures.query),
      prisma.category.count({ where: apiFeatures.query.where })
    ]);

    return { data: categories, total, page: apiFeatures.queryString.page || 1 };
  }
}

export class UomService {
  static async create(data: { name: string; abbreviation: string }) {
    return prisma.unitOfMeasure.create({ data });
  }

  static async update(id: string, data: { name?: string; abbreviation?: string }) {
    const { name, abbreviation } = data;
    return prisma.unitOfMeasure.update({ where: { id }, data: { name, abbreviation } });
  }

  static async toggleStatus(id: string) {
    const uom = await prisma.unitOfMeasure.findUnique({ where: { id } });
    if (!uom) throw new AppError(404, 'Unit of Measure not found');
    return prisma.unitOfMeasure.update({
      where: { id },
      data: { isActive: !uom.isActive }
    });
  }

  static async delete(id: string) {
    const productCount = await prisma.product.count({ where: { uomId: id } });
    if (productCount > 0) {
      throw new AppError(400, 'This Unit of Measure cannot be deleted because it is currently assigned to one or more products or recipes.');
    }
    return prisma.unitOfMeasure.delete({ where: { id } });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['name', 'abbreviation'])
      .sort()
      .paginate();

    apiFeatures.query = { ...apiFeatures.query, include: { _count: { select: { products: true } } } };

    const [uoms, total] = await Promise.all([
      prisma.unitOfMeasure.findMany(apiFeatures.query),
      prisma.unitOfMeasure.count({ where: apiFeatures.query.where })
    ]);

    return { data: uoms, total, page: apiFeatures.queryString.page || 1 };
  }
}

export class ProductService {
  static async create(data: { sku: string; name: string; categoryId: string; uomId: string; type: any; isActive?: boolean }) {
    return prisma.product.create({ data });
  }

  static async update(id: string, data: { sku?: string; name?: string; categoryId?: string; uomId?: string; type?: any }) {
    const { sku, name, categoryId, uomId, type } = data;
    return prisma.product.update({ where: { id }, data: { sku, name, categoryId, uomId, type } });
  }

  static async toggleStatus(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError(404, 'Product not found');
    return prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive }
    });
  }

  static async delete(id: string) {
    const recipesAsOutput = await prisma.recipe.count({ where: { outputProductId: id } });
    const recipeItems = await prisma.recipeItem.count({ where: { inputProductId: id } });
    const workOrders = await prisma.workOrder.count({ where: { productId: id } });
    const finishedGoods = await prisma.finishedGoods.count({ where: { productId: id } });
    
    if (recipesAsOutput > 0 || recipeItems > 0 || workOrders > 0 || finishedGoods > 0) {
      throw new AppError(400, 'This Product cannot be deleted because it is currently assigned to one or more recipes, work orders, or finished goods.');
    }
    return prisma.product.delete({ where: { id } });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['name', 'sku'])
      .sort()
      .paginate();

    apiFeatures.query = { 
      ...apiFeatures.query, 
      include: { 
        category: true, 
        uom: true,
        _count: { select: { recipesAsOutput: true, recipeItems: true, workOrders: true, finishedGoods: true } }
      } 
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany(apiFeatures.query),
      prisma.product.count({ where: apiFeatures.query.where })
    ]);

    return { data: products, total, page: apiFeatures.queryString.page || 1 };
  }
}

export class WarehouseService {
  static async create(data: { name: string; location?: string }) {
    return prisma.warehouse.create({ data });
  }

  static async update(id: string, data: { name?: string; location?: string }) {
    const { name, location } = data;
    return prisma.warehouse.update({ where: { id }, data: { name, location } });
  }

  static async toggleStatus(id: string) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new AppError(404, 'Warehouse not found');
    return prisma.warehouse.update({
      where: { id },
      data: { isActive: !warehouse.isActive }
    });
  }

  static async delete(id: string) {
    const storageLocations = await prisma.storageLocation.count({ where: { warehouseId: id } });
    if (storageLocations > 0) {
      throw new AppError(400, 'This Warehouse cannot be deleted because it currently has storage locations.');
    }
    return prisma.warehouse.delete({ where: { id } });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['name', 'location'])
      .sort()
      .paginate();
      
    apiFeatures.query = { ...apiFeatures.query, include: { storageLocations: true, _count: { select: { storageLocations: true } } } };

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany(apiFeatures.query),
      prisma.warehouse.count({ where: apiFeatures.query.where })
    ]);

    return { data: warehouses, total, page: apiFeatures.queryString.page || 1 };
  }
}

export class RecipeService {
  static async create(data: { code: string; name: string; outputProductId: string; outputQty: number; items: any[] }) {
    // Validate that the output product exists and is of correct type
    const product = await prisma.product.findUnique({ where: { id: data.outputProductId } });
    if (!product) throw new AppError(404, 'Output Product not found');

    return await prisma.$transaction(async (tx: any) => {
      const newRecipe = await tx.recipe.create({
        data: {
          code: data.code,
          name: data.name,
          outputProductId: data.outputProductId,
          outputQty: data.outputQty,
          items: {
            create: data.items,
          },
        },
        include: {
          items: true,
        }
      });
      return newRecipe;
    });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures({}, queryObj)
      .filter()
      .search(['name', 'code'])
      .sort()
      .paginate();

    apiFeatures.query = { 
      ...apiFeatures.query, 
      include: {
        outputProduct: true,
        items: {
          include: { inputProduct: true }
        }
      } 
    };

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany(apiFeatures.query),
      prisma.recipe.count({ where: apiFeatures.query.where })
    ]);

    return { data: recipes, total, page: apiFeatures.queryString.page || 1 };
  }
}
