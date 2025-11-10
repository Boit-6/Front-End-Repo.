export type Role = "ADMIN" | "USER";

export interface IUser {
    id?: number;
    name?: string;
    last_Name?: string;
    email: string;
    cellPhone?: number;
    password: string;
    role?: Role;
}