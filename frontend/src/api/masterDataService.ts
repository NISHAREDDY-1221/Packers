import apiClient from "./axios";

// --- Types matching Prisma Schema ---
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role?: {
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  uomId: string;
  type?: "RAW_MATERIAL" | "PACKAGING" | "FINISHED_GOOD";
  isActive?: boolean;
  availableStock?: number;
  category?: Category;
  uom?: UnitOfMeasure;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
}

export interface RecipeItem {
  id?: string;
  inputProductId: string;
  requiredQty: number;
  tolerancePct?: number;
  isPackaging?: boolean;
  inputProduct?: Product;
}

export interface Recipe {
  id: string;
  code: string;
  name: string;
  outputProductId: string;
  outputQty: number;
  isActive?: boolean;
  items?: RecipeItem[];
  outputProduct?: Product;
}

// --- API Service ---
export const masterDataService = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<any>("/master-data/categories");
    return res.data.data.data || res.data.data;
  },
  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await apiClient.post<{ success: boolean; data: Category }>(
      "/master-data/categories",
      data,
    );
    return res.data.data;
  },

  // Units of Measure
  async getUOMs(): Promise<UnitOfMeasure[]> {
    const res = await apiClient.get<any>("/master-data/uom");
    return res.data.data.data || res.data.data;
  },
  async createUOM(data: Partial<UnitOfMeasure>): Promise<UnitOfMeasure> {
    const res = await apiClient.post<{ success: boolean; data: UnitOfMeasure }>(
      "/master-data/uom",
      data,
    );
    return res.data.data;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<any>("/master-data/products");
    return res.data.data.data || res.data.data;
  },
  async createProduct(data: Partial<Product>): Promise<Product> {
    const res = await apiClient.post<{ success: boolean; data: Product }>(
      "/master-data/products",
      data,
    );
    return res.data.data;
  },

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    const res = await apiClient.get<any>("/master-data/warehouses");
    return res.data.data.data || res.data.data;
  },
  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const res = await apiClient.post<{ success: boolean; data: Warehouse }>(
      "/master-data/warehouses",
      data,
    );
    return res.data.data;
  },

  // Recipes / BOM
  async getRecipes(): Promise<Recipe[]> {
    const res = await apiClient.get<any>("/master-data/recipes");
    return res.data.data.data || res.data.data;
  },
  async createRecipe(data: Partial<Recipe>): Promise<Recipe> {
    const res = await apiClient.post<{ success: boolean; data: Recipe }>(
      "/master-data/recipes",
      data,
    );
    return res.data.data;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const res = await apiClient.get<any>("/master-data/users");
    return res.data.data.data || res.data.data;
  },
};
