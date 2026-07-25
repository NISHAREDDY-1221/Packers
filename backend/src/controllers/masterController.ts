import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { sendResponse } from "../utils/response";
import {
  CategoryService,
  UomService,
  ProductService,
  WarehouseService,
  RecipeService,
  UserService,
} from "../services/masterService";

// --- Categories ---
export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await CategoryService.create(req.body);
    sendResponse(res, 201, "Category created", category);
  },
);

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.getAll(req.query);
  sendResponse(res, 200, "Categories retrieved", result);
});

// --- Units of Measure ---
export const createUOM = catchAsync(async (req: Request, res: Response) => {
  const uom = await UomService.create(req.body);
  sendResponse(res, 201, "UOM created", uom);
});

export const getUOMs = catchAsync(async (req: Request, res: Response) => {
  const result = await UomService.getAll(req.query);
  sendResponse(res, 200, "UOMs retrieved", result);
});

// --- Products ---
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.create(req.body);
  sendResponse(res, 201, "Product created", product);
});

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAll(req.query);
  sendResponse(res, 200, "Products retrieved", result);
});

// --- Warehouses ---
export const createWarehouse = catchAsync(
  async (req: Request, res: Response) => {
    const warehouse = await WarehouseService.create(req.body);
    sendResponse(res, 201, "Warehouse created", warehouse);
  },
);

export const getWarehouses = catchAsync(async (req: Request, res: Response) => {
  const result = await WarehouseService.getAll(req.query);
  sendResponse(res, 200, "Warehouses retrieved", result);
});

// --- Recipes (BOM) ---
export const createRecipe = catchAsync(async (req: Request, res: Response) => {
  const recipe = await RecipeService.create(req.body);
  sendResponse(res, 201, "Recipe created", recipe);
});

export const getRecipes = catchAsync(async (req: Request, res: Response) => {
  const result = await RecipeService.getAll(req.query);
  sendResponse(res, 200, "Recipes retrieved", result);
});

// --- Users ---
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAll(req.query);
  sendResponse(res, 200, "Users retrieved", result);
});
