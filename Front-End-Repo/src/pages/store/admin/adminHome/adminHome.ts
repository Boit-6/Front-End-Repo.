import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE,CATEGORIES_ROUTE, PRODUCTS_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName } from "../../../../utils/service";


checkAuthUser("ADMIN", LOGIN_ROUTE);

const manageCategories = document.getElementById("manageCategories") as HTMLButtonElement;
const manageProducts = document.getElementById("manageProducts") as HTMLButtonElement;
const manageOrders = document.getElementById("manageOrders") as HTMLButtonElement; // implemetar mas adealnte

manageCategories.addEventListener("click", () => {
    navigate(CATEGORIES_ROUTE);
});

manageProducts.addEventListener("click", () => {
    navigate(PRODUCTS_ROUTE);
});

const logout = document.getElementById("logout") as HTMLButtonElement;

logout.addEventListener("click", () => {
    logoutUser();
});

showUserName();


// ----- DASHBOARD COUNTS (CATEGORIES / PRODUCTS) -----
(async () => {
    try {
        const [catRes, prodRes] = await Promise.all([
            fetch("http://localhost:8080/category", { method: "GET", headers: { "Content-Type": "application/json" } }),
            fetch("http://localhost:8080/product/admin", { method: "GET", headers: { "Content-Type": "application/json" } }),
        ]);

        if (catRes.ok) {
            const categories = await catRes.json();
            const catCountEl = document.querySelector(".card__categories .count") as HTMLElement | null;
            if (catCountEl) catCountEl.textContent = String(Array.isArray(categories) ? categories.length : 0);
        }

        if (prodRes.ok) {
            const products = await prodRes.json();
            const prodCountEl = document.querySelector(".card__products .count") as HTMLElement | null;
            if (prodCountEl) prodCountEl.textContent = String(Array.isArray(products) ? products.length : 0);
        }
    } catch (e) {
        // silently ignore for now
    }
})();