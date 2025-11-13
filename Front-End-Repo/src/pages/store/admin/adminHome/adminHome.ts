import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE, CATEGORIES_ROUTE, PRODUCTS_ROUTE, ORDERS_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName, adjustHeaderLinks } from "../../../../utils/service";

/*
  Admin Dashboard (home)
  - Enlaces rápidos a gestión de categorías, productos y pedidos
  - Muestra contadores básicos (categorías, productos, pedidos, disponibles)
*/

checkAuthUser("ADMIN", LOGIN_ROUTE);
adjustHeaderLinks();

const manageCategories = document.getElementById("manageCategories") as HTMLButtonElement;
const manageProducts = document.getElementById("manageProducts") as HTMLButtonElement;
const manageOrders = document.getElementById("manageOrders") as HTMLButtonElement;

manageCategories.addEventListener("click", () => navigate(CATEGORIES_ROUTE));
manageProducts.addEventListener("click", () => navigate(PRODUCTS_ROUTE));
manageOrders.addEventListener("click", () => navigate(ORDERS_ROUTE));

const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());

showUserName();

// Cargar y mostrar los contadores del dashboard
(async () => {
    try {
        const [catRes, prodRes, ordersRes] = await Promise.all([
            fetch("http://localhost:8080/category", { method: "GET", headers: { "Content-Type": "application/json" } }),
            fetch("http://localhost:8080/product/admin", { method: "GET", headers: { "Content-Type": "application/json" } }),
            fetch("http://localhost:8080/orders", { method: "GET", headers: { "Content-Type": "application/json" } }),
        ]);

        if (catRes.ok) {
            const categories = await catRes.json();
            const catCountEl = document.querySelector(".card__categories .count") as HTMLElement | null;
            if (catCountEl) catCountEl.textContent = String(Array.isArray(categories) ? categories.length : 0);
        }

        if (prodRes.ok) {
            const products = await prodRes.json();
            const prodCountEl = document.querySelector(".card__products .count") as HTMLElement | null;
            const availableEl = document.querySelector(".card__available .count") as HTMLElement | null;
            if (prodCountEl) prodCountEl.textContent = String(Array.isArray(products) ? products.length : 0);
            if (availableEl) {
                const availableCount = Array.isArray(products) ? products.filter((p: any) => p.availableProduct).length : 0;
                availableEl.textContent = String(availableCount);
            }
        }

        if (ordersRes.ok) {
            const orders = await ordersRes.json();
            const ordersEl = document.querySelector(".card__orders .count") as HTMLElement | null;
            if (ordersEl) ordersEl.textContent = String(Array.isArray(orders) ? orders.length : 0);
        }
    } catch (e) {
        // no interrumpir el dashboard por errores de conteo
    }
})();