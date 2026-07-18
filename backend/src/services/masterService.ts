import { prisma } from '../utils/prisma';
import { APIFeatures } from '../utils/apiFeatures';
import { AppError } from '../middlewares/error';

export class CategoryService {
  static async create(data: { name: string; description?: string }) {
    return prisma.category.create({ data });
  }

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures(prisma.category, queryObj)
      .filter()
      .search(['name', 'description'])
      .sort()
      .paginate();

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

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures(prisma.unitOfMeasure, queryObj)
      .filter()
      .search(['name', 'abbreviation'])
      .sort()
      .paginate();

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

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures(prisma.product, queryObj)
      .filter()
      .search(['name', 'sku'])
      .sort()
      .paginate();

    apiFeatures.query = { ...apiFeatures.query, include: { category: true, uom: true } };

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

  static async getAll(queryString: any) {
    const queryObj = { ...queryString };
    const apiFeatures = new APIFeatures(prisma.warehouse, queryObj)
      .filter()
      .search(['name', 'location'])
      .sort()
      .paginate();
      
    apiFeatures.query = { ...apiFeatures.query, include: { storageLocations: true } };

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
    const apiFeatures = new APIFeatures(prisma.recipe, queryObj)
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
