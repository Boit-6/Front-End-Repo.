import type { IProduct } from "../../../../types/IProducts";
import type { IOrderDetail } from "../../../../types/IOrders";
import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE, USER_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName, adjustHeaderLinks } from "../../../../utils/service";
import { showToast } from "../../../../utils/toast";
import { apiFetch } from "../../../../utils/api";

showUserName();
adjustHeaderLinks();
checkAuthUser("USER", LOGIN_ROUTE);

const CART_KEY = "cartDetails";
const API_BASE = "http://localhost:8080";

// Elementos del DOM
const productImage = document.getElementById("productImage") as HTMLImageElement;
const productName = document.getElementById("productName") as HTMLHeadingElement;
const productDescription = document.getElementById("productDescription") as HTMLParagraphElement;
const productPrice = document.getElementById("productPrice") as HTMLParagraphElement;
const productCategory = document.getElementById("productCategory") as HTMLParagraphElement;
const productStatus = document.getElementById("productStatus") as HTMLSpanElement;
const productQuantity = document.getElementById("productQuantity") as HTMLInputElement;
const decrementQuantity = document.getElementById("decrementQuantity") as HTMLButtonElement;
const incrementQuantity = document.getElementById("incrementQuantity") as HTMLButtonElement;
const addToCartButton = document.getElementById("addToCart") as HTMLButtonElement;
const backToStoreButton = document.getElementById("backToStore") as HTMLButtonElement;
const logout = document.getElementById("logout") as HTMLButtonElement;

logout.addEventListener("click", () => logoutUser());

// Obtener ID de producto desde la querystring
const params = new URLSearchParams(window.location.search);
const productIdParam = params.get("id");

if (!productIdParam) {
    navigate(USER_ROUTE);
    throw new Error("No se proporcionó un ID de producto");
}

const productId = Number(productIdParam);
if (Number.isNaN(productId)) {
    navigate(USER_ROUTE);
    throw new Error("El ID de producto es inválido");
}

// Funciones de carrito (localStorage)
const loadCart = (): IOrderDetail[] => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as IOrderDetail[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveCart = (cart: IOrderDetail[]) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

const addOrUpdateCartItem = (detail: IOrderDetail) => {
    const cart = loadCart();
    const existingIndex = cart.findIndex(d => d.product === detail.product);
    if (existingIndex >= 0) {
        const existing = cart[existingIndex];
        const newAmount = existing.amount + detail.amount;
        cart[existingIndex] = {
            ...existing,
            amount: newAmount,
            subtotal: Number((detail.subtotal / detail.amount * newAmount).toFixed(2))
        };
    } else {
        cart.push(detail);
    }
    saveCart(cart);
};

const calcSubtotal = (price: number, amount: number) => Number((price * amount).toFixed(2));

/* Render del detalle del producto */
const renderProductDetail = (product: IProduct) => {
    productImage.src = product.urlImg;
    productImage.alt = product.name;
    productName.textContent = product.name;
    productDescription.textContent = product.description;
    productPrice.textContent = `$${product.price.toLocaleString("es-AR")}`;
    productCategory.textContent = `Categoría: ${product.category.name}`;

    const statusLabel = product.availableProduct ? "Disponible" : "No disponible";
    productStatus.textContent = `${statusLabel} ${
        product.availableProduct ? `(Stock: ${product.stock})` : ""
    }`.trim();
    productStatus.classList.toggle("is-available", product.availableProduct);
    productStatus.classList.toggle("is-unavailable", !product.availableProduct);

    const maxQuantity = Math.max(product.stock, 1);
    productQuantity.max = String(maxQuantity);
    productQuantity.value = "1";

    addToCartButton.disabled = !product.availableProduct || product.stock === 0;
    addToCartButton.textContent = addToCartButton.disabled ? "Sin stock" : "Agregar al carrito";
};

// ----- CONTROL DE CANTIDAD -----
const updateQuantity = (delta: number) => {
    const current = Number(productQuantity.value);
    const max = Number(productQuantity.max) || Infinity;
    const nextValue = Math.min(Math.max(current + delta, 1), max);
    productQuantity.value = String(nextValue);
};

decrementQuantity.addEventListener("click", () => updateQuantity(-1));
incrementQuantity.addEventListener("click", () => updateQuantity(1));

// ----- AGREGAR AL CARRITO -----
addToCartButton.addEventListener("click", async () => {
    try {
        const product = await apiFetch<IProduct>(
            `${API_BASE}/product/${productId}`,
            { method: "GET" }
        );

        const amount = Number(productQuantity.value) || 1;
        if (amount <= 0) {
            showToast("La cantidad debe ser mayor a 0", "warning");
            return;
        }
        if (!product.availableProduct || product.stock === 0) {
            showToast("El producto no está disponible", "warning");
            return;
        }

        const subtotal = calcSubtotal(product.price, amount);
        const detail: IOrderDetail = {
            amount,
            subtotal,
            product
        };

        addOrUpdateCartItem(detail);
        showToast("Producto agregado al carrito", "success");
    } catch (error) {
        console.error(error);
        showToast("Error al agregar el producto", "error");
    }
});

// ----- BOTÓN VOLVER -----
backToStoreButton.addEventListener("click", () => navigate(USER_ROUTE));

// ----- CARGAR DETALLE DE PRODUCTO -----
try {
    const product = await apiFetch<IProduct>(
        `${API_BASE}/product/${productId}`,
        { method: "GET" }
    );
    renderProductDetail(product);
} catch (error) {
    console.error("Error al cargar producto:", error);
    navigate(USER_ROUTE);
}
