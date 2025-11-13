import type {IUser, Role} from "../types/IUser";
import {navigate, LOGIN_ROUTE} from "./navigate";

export const checkAuthUser = (rol: Role | Role[], route: string) => {
    const user = localStorage.getItem("userData");
    if (!user){
        navigate(route);
        return;
    }
    const parseUser: IUser = JSON.parse(user);

    let allowed: Role[] = [];
    if (Array.isArray(rol)) {
        allowed = rol;
    } else if (rol === 'USER') {
        allowed = ['USER', 'ADMIN'];
    } else {
        allowed = [rol];
    }

    if (!allowed.includes(parseUser.role as Role)){
        navigate(route);
        return;
    }
};

export const saveUser = (userData: IUser) => {
    const parse = JSON.stringify(userData);
    localStorage.setItem("userData", parse)
};

export const logoutUser = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("orderDetails");
    navigate(LOGIN_ROUTE);
}
