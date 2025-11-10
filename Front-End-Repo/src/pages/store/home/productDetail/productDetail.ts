// ----- IMPORTS -----
import type { IProduct } from "../../../../types/IProducts";
import type { IOrder, IOrderDetail } from "../../../../types/IOrders"; // IMPORTANTE
import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE, USER_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName } from "../../../../utils/service";

// ----- MOSTRAR NOMBRE DEL USUARIO -----
showUserName();

// ----- VERIFICAR USUARIO -----
checkAuthUser("USER", LOGIN_ROUTE);

// ----- REFERENCIAS AL DOM -----
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

// ----- LOGOUT -----
logout.addEventListener("click", () => logoutUser());

// ----- OBTENER ID DE PRODUCTO -----
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

// ================================
// ======== CARRITO (LOCALSTORAGE)
// ================================
// Key usada en localStorage
const CART_KEY = "cartDetails";


const loadCart = (): IOrderDetail[] => {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as IOrderDetail[];
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
};

/**
 * Guarda el cart en localStorage
 */
const saveCart = (cart: IOrderDetail[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

/**
 * Añade o actualiza un detalle en el cart.
 * Si ya existe el productId, suma la cantidad y recalcula subtotal.
 */
const addOrUpdateCartItem = (detail: IOrderDetail) => {
    const cart = loadCart();
    const existingIndex = cart.findIndex(d => d.product === detail.product);
    if (existingIndex >= 0) {
        // actualizar cantidad y subtotal
        const existing = cart[existingIndex];
        const newAmount = existing.amount + detail.amount;
        cart[existingIndex] = {
            ...existing,
            amount: newAmount,
            subtotal: Number((detail.subtotal / detail.amount * newAmount).toFixed(2)) // recalcula según precio unitario
        };
    } else {
        cart.push(detail);
    }
    saveCart(cart);
};

/**
 * Utility para calcular subtotal (precio * cantidad)
 */
const calcSubtotal = (price: number, amount: number) => {
    return Number((price * amount).toFixed(2));
};

// ----- RENDERIZAR DETALLE DE PRODUCTO -----
const renderProductDetail = (product: IProduct) => {
    productImage.src = product.urlImg;
    productImage.alt = product.name;
    productName.textContent = product.name;
    productDescription.textContent = product.description;
    productPrice.textContent = `$${product.price.toLocaleString("es-AR")}`;
    productCategory.textContent = `Categoría: ${product.category.name}`;
    const statusLabel = product.availableProduct ? "Disponible" : "No disponible";
    productStatus.textContent = `${statusLabel} ${product.availableProduct ? `(Stock: ${product.stock})` : ""}`.trim();
    productStatus.classList.toggle("is-available", product.availableProduct);
    productStatus.classList.toggle("is-unavailable", !product.availableProduct);

    const maxQuantity = Math.max(product.stock, 1);
    productQuantity.max = String(maxQuantity);
    productQuantity.value = "1";

    addToCartButton.disabled = !product.availableProduct || product.stock === 0;
    if (addToCartButton.disabled) {
        addToCartButton.textContent = "Sin stock";
    } else {
        addToCartButton.textContent = "Agregar al carrito";
    }
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

//====================================================
//===== MANEJO DE ORDEN - addToCartButton ============
 // Cuando se hace click agrega el detalle al carrito (localStorage)
//====================================================
addToCartButton.addEventListener("click", async () => {
    try {
        // Obtener producto actual desde la API para asegurarnos del precio y stock actuales
        const response = await fetch(`http://localhost:8080/product/${productId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Error al obtener el detalle del producto antes de agregar al carrito");

        const product: IProduct = await response.json();

        const amount = Number(productQuantity.value) || 1;
        if (amount <= 0) {
            alert("La cantidad debe ser mayor a 0");
            return;
        }
        if (!product.availableProduct || product.stock === 0) {
            alert("El producto no está disponible");
            return;
        }

        const subtotal = calcSubtotal(product.price, amount);

        const detail: IOrderDetail = {
            amount,
            subtotal,
            product: product,
        };

        // Añadir o actualizar en el carrito local
        addOrUpdateCartItem(detail);

        // Notificar al usuario
        alert("Producto agregado al carrito");
    } catch (error) {
        console.error(error);
        alert("Error al agregar el producto");
    }
});

// ----- BOTÓN VOLVER -----
backToStoreButton.addEventListener("click", () => navigate(USER_ROUTE));

// ----- OBTENER DETALLE DEL PRODUCTO -----
try {
    const response = await fetch(`http://localhost:8080/product/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error("Error al obtener el detalle del producto");

    const product: IProduct = await response.json();
    renderProductDetail(product);
} catch (error) {
    console.error("No fue posible cargar el producto", error);
    navigate(USER_ROUTE);
}
