import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { sendResponse } from '../utils/response';
import { CategoryService, UomService, ProductService, WarehouseService, RecipeService } from '../services/masterService';

// --- Categories ---
export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.create(req.body);
  sendResponse(res, 201, 'Category created', category);
});

export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.getAll(req.query);
  sendResponse(res, 200, 'Categories retrieved', result);
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.update(req.params.id as string, req.body);
  sendResponse(res, 200, 'Category updated', category);
});

export const toggleCategoryStatus = catchAsync(async (req: Request, res: Response) => {
  const category = await CategoryService.toggleStatus(req.params.id as string);
  sendResponse(res, 200, 'Category status toggled', category);
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  await CategoryService.delete(req.params.id as string);
  sendResponse(res, 204, 'Category deleted', null);
});

// --- Units of Measure ---
export const createUOM = catchAsync(async (req: Request, res: Response) => {
  const uom = await UomService.create(req.body);
  sendResponse(res, 201, 'UOM created', uom);
});

export const getUOMs = catchAsync(async (req: Request, res: Response) => {
  const result = await UomService.getAll(req.query);
  sendResponse(res, 200, 'UOMs retrieved', result);
});

export const updateUOM = catchAsync(async (req: Request, res: Response) => {
  const uom = await UomService.update(req.params.id as string, req.body);
  sendResponse(res, 200, 'UOM updated', uom);
});

export const toggleUOMStatus = catchAsync(async (req: Request, res: Response) => {
  const uom = await UomService.toggleStatus(req.params.id as string);
  sendResponse(res, 200, 'UOM status toggled', uom);
});

export const deleteUOM = catchAsync(async (req: Request, res: Response) => {
  await UomService.delete(req.params.id as string);
  sendResponse(res, 204, 'UOM deleted', null);
});

// --- Products ---
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.create(req.body);
  sendResponse(res, 201, 'Product created', product);
});

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.getAll(req.query);
  sendResponse(res, 200, 'Products retrieved', result);
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.update(req.params.id as string, req.body);
  sendResponse(res, 200, 'Product updated', product);
});

export const toggleProductStatus = catchAsync(async (req: Request, res: Response) => {
  const product = await ProductService.toggleStatus(req.params.id as string);
  sendResponse(res, 200, 'Product status toggled', product);
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  await ProductService.delete(req.params.id as string);
  sendResponse(res, 204, 'Product deleted', null);
});

// --- Warehouses ---
export const createWarehouse = catchAsync(async (req: Request, res: Response) => {
  const warehouse = await WarehouseService.create(req.body);
  sendResponse(res, 201, 'Warehouse created', warehouse);
});

export const getWarehouses = catchAsync(async (req: Request, res: Response) => {
  const result = await WarehouseService.getAll(req.query);
  sendResponse(res, 200, 'Warehouses retrieved', result);
});

export const updateWarehouse = catchAsync(async (req: Request, res: Response) => {
  const warehouse = await WarehouseService.update(req.params.id as string, req.body);
  sendResponse(res, 200, 'Warehouse updated', warehouse);
});

export const toggleWarehouseStatus = catchAsync(async (req: Request, res: Response) => {
  const warehouse = await WarehouseService.toggleStatus(req.params.id as string);
  sendResponse(res, 200, 'Warehouse status toggled', warehouse);
});

export const deleteWarehouse = catchAsync(async (req: Request, res: Response) => {
  await WarehouseService.delete(req.params.id as string);
  sendResponse(res, 204, 'Warehouse deleted', null);
});

// --- Recipes (BOM) ---
export const createRecipe = catchAsync(async (req: Request, res: Response) => {
  const recipe = await RecipeService.create(req.body);
  sendResponse(res, 201, 'Recipe created', recipe);
});

export const getRecipes = catchAsync(async (req: Request, res: Response) => {
  const result = await RecipeService.getAll(req.query);
  sendResponse(res, 200, 'Recipes retrieved', result);
});
