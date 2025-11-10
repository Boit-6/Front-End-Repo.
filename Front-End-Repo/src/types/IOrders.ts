import type { IProduct } from "./IProducts";
export interface IOrder {
    id: number;
    state: state;
    total: number;
    payment: payment;
    delivery: delivery;
    details: IOrderDetail[];
    date?: string;
}
export interface IOrderDetail {
    amount: number;
    subtotal: number;
    product: IProduct;
}

export type payment = "CASH" | "CARD" | "TRANSFER";
export type delivery = "DELIVERY" | "TAKEAWAY";
export type state = "PENDING" | "CONFIRMED" | "CANCELED" |"FINISHED";
