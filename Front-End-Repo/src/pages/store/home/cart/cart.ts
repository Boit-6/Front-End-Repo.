
// IMPORTS
import type { IOrder, IOrderDetail } from "../../../../types/IOrders";
import type { IProduct } from "../../../../types/IProducts";
import type { IUser } from "../../../../types/IUser";
import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE, USER_ROUTE, navigate } from "../../../../utils/navigate";
import { showUserName } from "../../../../utils/service";

showUserName();
checkAuthUser("USER", LOGIN_ROUTE);

const CART_KEY = "cartDetails";         // misma key que product-detail.ts
const PENDING_ORDER_KEY = "pendingOrder"; // donde guardamos el pedido armado al confirmar

const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());

const cartList = document.getElementById("cartList") as HTMLDivElement;
const summarySubtotal = document.getElementById("summarySubtotal") as HTMLElement;
const summaryShipping = document.getElementById("summaryShipping") as HTMLElement;
const summaryTotal = document.getElementById("summaryTotal") as HTMLElement;
const proceedToCheckout = document.getElementById("proceedToCheckout") as HTMLButtonElement;
const emptyCartBtn = document.getElementById("emptyCart") as HTMLButtonElement;

const checkoutModal = document.getElementById("checkoutModal") as HTMLDivElement;
const closeModal = document.getElementById("closeModal") as HTMLButtonElement;
const checkoutForm = document.getElementById("checkoutForm") as HTMLFormElement;
const modalTotal = document.getElementById("modalTotal") as HTMLElement;

// modal 
const phoneInput = document.getElementById("phone") as HTMLInputElement;
const addressInput = document.getElementById("address") as HTMLTextAreaElement;
const paymentSelect = document.getElementById("payment") as HTMLSelectElement;
const deliverySelect = document.getElementById("delivery") as HTMLSelectElement;
const notesInput = document.getElementById("notes") as HTMLTextAreaElement;

const SHIPPING_COST = 500;

// CARGAR / GUARDAR carrito
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
const storeUserRaw = localStorage.getItem("userData");
const storeUser: Partial<IUser> | null = storeUserRaw ? JSON.parse(storeUserRaw) as Partial<IUser> : null;

const saveCart = (cart: IOrderDetail[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

// VACIAR carrito
const emptyCart = () => {
    localStorage.removeItem(CART_KEY);
    renderCart();
};

// RENDERIZAR carrito en pantalla
const renderCart = async () => {
    cartList.innerHTML = "";
    const cart = loadCart();
    if (cart.length === 0) {
        cartList.innerHTML = `<p>Tu carrito está vacío.</p>`;
        updateSummary(0);
        return;
    }

    // Por cada detalle, traemos el producto para mostrar la info
    let subtotalTotal = 0;
    for (const detail of cart) {
        try {
            const resp = await fetch(`http://localhost:8080/product/${detail.product.id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!resp.ok){
                throw new Error("No se pudo obtener producto " + detail.product.id);
                }
            const product: IProduct = await resp.json();

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
            console.error("Error al cargar producto del carrito", error);
        }
    }

    updateSummary(subtotalTotal);

    attachCartListeners();
};

const updateSummary = (subtotalValue: number) => {
    const subtotal = Number(subtotalValue.toFixed(2));
    const total = Number((subtotal + SHIPPING_COST).toFixed(2));
    summarySubtotal.textContent = `$${subtotal.toLocaleString("es-AR")}`;
    summaryShipping.textContent = `$${SHIPPING_COST.toLocaleString("es-AR")}`;
    summaryTotal.textContent = `$${total.toLocaleString("es-AR")}`;
    modalTotal.textContent = `$${total.toLocaleString("es-AR")}`;
};

const attachCartListeners = () => {
    const decrementButtons = Array.from(document.querySelectorAll(".btn-decrement")) as HTMLButtonElement[];
    const incrementButtons = Array.from(document.querySelectorAll(".btn-increment")) as HTMLButtonElement[];
    const deleteButtons = Array.from(document.querySelectorAll(".btn-delete-item")) as HTMLButtonElement[];
    const qtyInputs = Array.from(document.querySelectorAll(".qty-input")) as HTMLInputElement[];

    decrementButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            changeQuantity(id, -1);
        });
    });

    incrementButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            changeQuantity(id, +1);
        });
    });

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute("data-id"));
            removeItem(id);
        });
    });

    qtyInputs.forEach(input => {
        input.addEventListener("change", (e) => {
            const target = e.currentTarget as HTMLInputElement;
            const id = Number(target.getAttribute("data-id"));
            let newVal = Number(target.value);
            if (Number.isNaN(newVal) || newVal < 1) newVal = 1;
            updateQuantityTo(id, newVal);
        });
    });
};

const changeQuantity = async (productId: number, delta: number) => {
    const cart = loadCart();
    const idx = cart.findIndex(d => Number(d.product.id) === productId);
    if (idx === -1) return;

    try {
        const resp = await fetch(`http://localhost:8080/product/${productId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (!resp.ok) throw new Error("No se pudo obtener producto para cambiar cantidad");
        const product: IProduct = await resp.json();

        const newAmount = Math.max(1, cart[idx].amount + delta);
        if (newAmount > product.stock) {
            alert("No hay suficiente stock para esa cantidad");
            return;
        }
        cart[idx].amount = newAmount;
        cart[idx].subtotal = Number((product.price * newAmount).toFixed(2));
        saveCart(cart);
        await renderCart();
    } catch (error) {
        console.error(error);
        alert("Error al actualizar cantidad");
    }
};

const updateQuantityTo = async (productId: number, newAmount: number) => {
    const cart = loadCart();
    const idx = cart.findIndex(d => Number(d.product.id) === productId);
    if (idx === -1) return;

    try {
        const resp = await fetch(`http://localhost:8080/product/${productId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if (!resp.ok) throw new Error("No se pudo obtener producto para actualizar cantidad");
        const product: IProduct = await resp.json();

        if (newAmount > product.stock) {
            alert("No hay suficiente stock para esa cantidad");
            newAmount = product.stock;
        }

        cart[idx].amount = newAmount;
        cart[idx].subtotal = Number((product.price * newAmount).toFixed(2));
        saveCart(cart);
        await renderCart();
    } catch (error) {
        console.error(error);
        alert("Error al actualizar cantidad");
    }
};

// Eliminar ítem
const removeItem = (productId: number) => {
    let cart = loadCart();
    cart = cart.filter(detail => Number(detail.product.id) !== productId);
    saveCart(cart);
    renderCart();
};

// Vaciar carrito
emptyCartBtn.addEventListener("click", () => {
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
        emptyCart();
    }
});

// PROCEDER AL CHECKOUT (abre modal)
proceedToCheckout.addEventListener("click", () => {
    const cart = loadCart();
    if (cart.length === 0) {
        alert("El carrito está vacío");
        return;
    }
    checkoutModal.classList.remove("hidden");
});

// cerrar modal
closeModal.addEventListener("click", () => {
    checkoutModal.classList.add("hidden");
});

// SUBMIT del checkout (armar IOrder y guardarlo localmente para enviarlo luego)
checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const cart = loadCart();
    if (cart.length === 0) {
        alert("Carrito vacío");
        return;
    }

    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const payment = paymentSelect.value.trim().toUpperCase(); // pendiente: CASH/CARD/TRANSFER (EN MAYÚSCULAS)
    const delivery = deliverySelect.value.trim().toUpperCase(); // DELIVERY/TAKEAWAY
    const notes = notesInput.value.trim();


    // calcular total
    const subtotal = cart.reduce((acc, d) => acc + d.subtotal, 0);
    const total = Number((subtotal + SHIPPING_COST).toFixed(2));

    // Validar que el usuario esté autenticado
    if (!storeUser || !storeUser.id) {
        alert("Error: Usuario no autenticado. Por favor, inicia sesión nuevamente.");
        navigate(LOGIN_ROUTE);
        return;
    }

    // Capturar el ID del usuario después de la validación
    const userId = storeUser.id;

    // Transformar el carrito al formato que espera el backend
    // El backend espera: { amount, subtotal, productId }
    // El frontend tiene: { amount, subtotal, product: IProduct }
    const orderDetails = cart.map(detail => ({
        amount: detail.amount,
        subtotal: detail.subtotal,
        productId: Number(detail.product.id)
    }));

    // Preparar IOrder tal como lo pide el backend
    async function createOrder() {
        try {
            const response = await fetch(`http://localhost:8080/orders/create/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    total,
                    payment: payment as any, // se espera "CASH"|"CARD"|"TRANSFER"
                    delivery: delivery as any, // se espera "DELIVERY"|"TAKEAWAY"
                    details: orderDetails,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error del servidor:", errorText);
                throw new Error(errorText || "No se pudo crear la orden");
            }

            const createdOrder = await response.json();
            alert("¡Orden creada exitosamente!");
            // Limpiar el carrito después de crear la orden
            emptyCart();
            checkoutModal.classList.add("hidden");
            // Opcional: redirigir a la página de pedidos
            // navigate("/store/home/myOrders");
        } catch (error) {
            console.error("Error al crear la orden:", error);
            alert(`Error al crear la orden: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }

    // Llamar la función
    createOrder();

/*
    // Guardamos el pedido listo para ser enviado posteriormente
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        order,
        phone,
        address,
        notes,
        createdAt: new Date().toISOString()
    }));*/

    //alert("Pedido preparado y guardado localmente. Cuando quieras, lo envías al servidor.");
    // El modal se cierra dentro de createOrder() después de crear la orden exitosamente
});

// Al cargar la página renderizamos
document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});
