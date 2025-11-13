/*
  Página: Carrito
  - Carga y persistencia del carrito en localStorage
  - Render del carrito, resumen y checkout
*/

import type { IOrderDetail } from "../../../../types/IOrders";
import type { IProduct } from "../../../../types/IProducts";
import type { IUser } from "../../../../types/IUser";
import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName, adjustHeaderLinks } from "../../../../utils/service";
import { showToast } from "../../../../utils/toast";
import { showConfirm } from "../../../../utils/confirm";
import { apiFetch } from "../../../../utils/api";
import { openModal, closeModal } from "../../../../utils/modal";

showUserName();
adjustHeaderLinks();
checkAuthUser("USER", LOGIN_ROUTE);

const CART_KEY = "cartDetails";
const SHIPPING_COST = 500;
const API_BASE = "http://localhost:8080";

// Elementos del DOM
const logout = document.getElementById("logout") as HTMLButtonElement;
const cartList = document.getElementById("cartList") as HTMLDivElement;
const summarySubtotal = document.getElementById("summarySubtotal") as HTMLElement;
const summaryShipping = document.getElementById("summaryShipping") as HTMLElement;
const summaryTotal = document.getElementById("summaryTotal") as HTMLElement;
const proceedToCheckout = document.getElementById("proceedToCheckout") as HTMLButtonElement;
const emptyCartBtn = document.getElementById("emptyCart") as HTMLButtonElement;
const checkoutModal = document.getElementById("checkoutModal") as HTMLDivElement;
const checkoutForm = document.getElementById("checkoutForm") as HTMLFormElement;
const modalTotal = document.getElementById("modalTotal") as HTMLElement;

logout.addEventListener("click", () => logoutUser());

// Cargar/guardar carrito en localStorage
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

const storeUserRaw = localStorage.getItem("userData");
const storeUser: Partial<IUser> | null = storeUserRaw ? (JSON.parse(storeUserRaw) as Partial<IUser>) : null;

// Vaciar carrito
const emptyCart = () => { localStorage.removeItem(CART_KEY); renderCart(); };

/* Render del carrito: detalles de ítems y resumen */
const renderCart = async () => {
    cartList.innerHTML = "";
    const cart = loadCart();
    if (cart.length === 0) {
        cartList.innerHTML = `<p>Tu carrito está vacío.</p>`;
        updateSummary(0);
        return;
    }

    let subtotalTotal = 0;
    for (const detail of cart) {
        try {
            const product = await apiFetch<IProduct>(
                `${API_BASE}/product/${detail.product.id}`,
                { method: "GET" }
            );

            const itemEl = document.createElement("div");
            itemEl.className = "product-card";
            itemEl.style.display = "flex";
            itemEl.style.alignItems = "center";
            itemEl.style.gap = "1rem";
            itemEl.style.marginBottom = "1rem";
            itemEl.style.padding = "0.9rem";

            itemEl.innerHTML = `
                <img src="${product.urlImg}" alt="${product.name}" style="width:90px; height:70px; object-fit:cover; border-radius:8px;">
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${product.name}</strong>
                        <span style="color:var(--primary); font-weight:700;">$${product.price.toLocaleString("es-AR")}</span>
                    </div>
                    <p style="margin:6px 0; color:#666;">${product.description || ""}</p>
                    <div style="display:flex; gap:0.6rem; align-items:center;">
                        <div class="quantity-wrapper" style="border-radius:8px;">
                            <button class="btn-decrement" data-id="${detail.product.id}">-</button>
                            <input class="qty-input" data-id="${detail.product.id}" type="number" value="${detail.amount}" min="1" max="${product.stock}">
                            <button class="btn-increment" data-id="${detail.product.id}">+</button>
                        </div>
                        <button class="btn-delete-item" data-id="${detail.product.id}" style="background:#d32f2f; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">🗑️</button>
                        <div style="margin-left:auto; font-weight:700;">$${detail.subtotal.toLocaleString("es-AR")}</div>
                    </div>
                </div>
            `;

            cartList.appendChild(itemEl);
            subtotalTotal += detail.subtotal;
        } catch (error) {
            console.error("Error al cargar producto:", error);
        }
    }

    updateSummary(subtotalTotal);
    attachCartListeners();
};

/* Actualizar valores del resumen (subtotal / envío / total) */
const updateSummary = (subtotalValue: number) => {
    const subtotal = Number(subtotalValue.toFixed(2));
    const total = Number((subtotal + SHIPPING_COST).toFixed(2));
    summarySubtotal.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    summaryShipping.textContent = `$${SHIPPING_COST.toLocaleString("es-AR")}`;
    summaryTotal.textContent = `$${total.toLocaleString("es-AR")}`;
    modalTotal.textContent = `$${total.toLocaleString("es-AR")}`;
};

/* Cambiar cantidad: + / - */
const changeQuantity = async (productId: number, delta: number) => {
    const cart = loadCart();
    const idx = cart.findIndex(d => Number(d.product.id) === productId);
    if (idx === -1) return;

    try {
        const product = await apiFetch<IProduct>(
            `${API_BASE}/product/${productId}`,
            { method: "GET" }
        );

        const newAmount = Math.max(1, cart[idx].amount + delta);
        if (newAmount > product.stock) {
            showToast("No hay suficiente stock", "warning");
            return;
        }

        cart[idx].amount = newAmount;
        cart[idx].subtotal = Number((product.price * newAmount).toFixed(2));
        saveCart(cart);
        await renderCart();
    } catch (error) {
        console.error(error);
        showToast("Error al actualizar cantidad", "error");
    }
};

/* Actualizar cantidad exactamente a un valor */
const updateQuantityTo = async (productId: number, newAmount: number) => {
    const cart = loadCart();
    const idx = cart.findIndex(d => Number(d.product.id) === productId);
    if (idx === -1) return;

    try {
        const product = await apiFetch<IProduct>(
            `${API_BASE}/product/${productId}`,
            { method: "GET" }
        );

        let finalAmount = newAmount;
        if (finalAmount > product.stock) {
            showToast("No hay suficiente stock", "warning");
            finalAmount = product.stock;
        }

        cart[idx].amount = finalAmount;
        cart[idx].subtotal = Number((product.price * finalAmount).toFixed(2));
        saveCart(cart);
        await renderCart();
    } catch (error) {
        console.error(error);
        showToast("Error al actualizar cantidad", "error");
    }
};

/* Eliminar ítem del carrito */
const removeItem = (productId: number) => {
    let cart = loadCart();
    cart = cart.filter(detail => Number(detail.product.id) !== productId);
    saveCart(cart);
    renderCart();
};

/* Adjuntar listeners para los controles del carrito (qty, delete) */
const attachCartListeners = () => {
    const decrementButtons = Array.from(
        document.querySelectorAll(".btn-decrement")
    ) as HTMLButtonElement[];
    const incrementButtons = Array.from(
        document.querySelectorAll(".btn-increment")
    ) as HTMLButtonElement[];
    const deleteButtons = Array.from(
        document.querySelectorAll(".btn-delete-item")
    ) as HTMLButtonElement[];
    const qtyInputs = Array.from(document.querySelectorAll(".qty-input")) as HTMLInputElement[];

    decrementButtons.forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            changeQuantity(id, -1);
        });
    });

    incrementButtons.forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            changeQuantity(id, +1);
        });
    });

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", e => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            removeItem(id);
        });
    });

    qtyInputs.forEach(input => {
        input.addEventListener("change", e => {
            const target = e.currentTarget as HTMLInputElement;
            const id = Number(target.getAttribute("data-id"));
            let newVal = Number(target.value);
            if (Number.isNaN(newVal) || newVal < 1) newVal = 1;
            updateQuantityTo(id, newVal);
        });
    });
};

// Vaciar carrito (botón)
emptyCartBtn.addEventListener("click", async () => {
    const ok = await showConfirm("¿Estás seguro de vaciar el carrito?");
    if (ok) {
        emptyCart();
        showToast("Carrito vaciado", "info");
    }
});

// Proceder al checkout
proceedToCheckout.addEventListener("click", () => {
    const cart = loadCart();
    if (cart.length === 0) {
        showToast("El carrito está vacío", "warning");
        return;
    }
    openModal(checkoutModal);
});

// Cierre del modal de checkout
const closeModalBtn = document.getElementById("closeModal") as HTMLButtonElement;
closeModalBtn.addEventListener("click", () => closeModal(checkoutModal));
checkoutModal.addEventListener("click", e => { if (e.target === checkoutModal) closeModal(checkoutModal); });

// Envío del formulario de checkout
checkoutForm.addEventListener("submit", async e => {
    e.preventDefault();

    const cart = loadCart();
    if (cart.length === 0) {
        showToast("Carrito vacío", "warning");
        return;
    }

    if (!storeUser || !storeUser.id) {
        showToast("Error: Usuario no autenticado", "error");
        navigate(LOGIN_ROUTE);
        return;
    }

    // Obtener datos del formulario
    const paymentSelect = document.getElementById("payment") as HTMLSelectElement;
    const deliverySelect = document.getElementById("delivery") as HTMLSelectElement;

    const payment = paymentSelect.value.trim().toUpperCase();
    const delivery = deliverySelect.value.trim().toUpperCase();

    // Calcular totales
    const subtotal = cart.reduce((acc, d) => acc + d.subtotal, 0);
    const total = Number((subtotal + SHIPPING_COST).toFixed(2));

    // Preparar detalles para el backend
    const orderDetails = cart.map(detail => ({
        amount: detail.amount,
        subtotal: detail.subtotal,
        productId: Number(detail.product.id)
    }));

    // Enviar orden al backend
    try {
        await apiFetch(
            `${API_BASE}/orders/create/${storeUser.id}`,
            {
                method: "POST",
                body: {
                    total,
                    payment: payment as any,
                    delivery: delivery as any,
                    details: orderDetails
                }
            },
            { successMessage: "¡Orden creada exitosamente!" }
        );
        emptyCart();
        closeModal(checkoutModal);
    } catch (error) {
        console.error("Error al crear la orden:", error);
    }
});

//----- INICIAR -----
document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});