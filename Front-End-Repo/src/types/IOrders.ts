import type { IProduct } from "./IProducts";
import type { IUser } from "./IUser";

export interface IOrder {
    id: number;
    state: state;
    total: number;
    payment: payment;
    delivery: delivery;
    details: IOrderDetail[];
    date?: string;
    createdAt?: string;
    user?: Partial<IUser>;
}
export interface IOrderDetail {
    amount: number;
    subtotal: number;
    product: IProduct;
}

export type payment = "CASH" | "CARD" | "TRANSFER";
export type delivery = "DELIVERY" | "TAKEAWAY";
export type state = "PENDING" | "CONFIRMED" | "CANCELED" |"FINISHED";
