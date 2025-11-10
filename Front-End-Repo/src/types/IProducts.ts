import type { ICategory } from "../types/ICategories";
export interface IProduct {
    name: string;
    description: string;
    price: number;
    stock: number;
    id: number;
    category: ICategory;
    urlImg: string;
    availableProduct: boolean;
}