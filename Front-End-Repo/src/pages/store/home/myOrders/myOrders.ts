import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import { showUserName, adjustHeaderLinks } from "../../../../utils/service";
import { apiFetch } from "../../../../utils/api";
import type { IUser } from "../../../../types/IUser";
import type { IOrder, IOrderDetail, state } from "../../../../types/IOrders";

/*
  Página: Mis pedidos
  - Muestra los pedidos del usuario logueado
  - Render simple de tarjetas con estado y total
*/

showUserName();
adjustHeaderLinks();
checkAuthUser("USER", LOGIN_ROUTE);

const API_BASE = "http://localhost:8080";
const STATE_LABELS: { [key in state]: string } = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELED: "Cancelado",
    FINISHED: "Finalizado"
};

const logout = document.getElementById("logout") as HTMLButtonElement;
const ordersContainer = document.getElementById("orders-container") as HTMLElement;
logout.addEventListener("click", () => logoutUser());

// Obtener usuario desde localStorage
const storeUserRaw = localStorage.getItem("userData");
const storeUser = storeUserRaw ? (JSON.parse(storeUserRaw) as Partial<IUser>) : null;

/* Render de las órdenes del usuario */
function renderOrders(orders: IOrder[]): void {
    ordersContainer.innerHTML = "";

    orders.forEach(order => {
        const orderCard = document.createElement("div");
        orderCard.classList.add("order-card");

        const detailsHTML = order.details
            .map(
                (detail: IOrderDetail) =>
                    `<span>${detail.product.name} (x${detail.amount}) - $${detail.subtotal.toFixed(2)}</span>`
            )
            .join("");

        const orderDate = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : order.date || "Sin fecha";

        orderCard.innerHTML = `
            <h3>Pedido #${order.id}</h3>
            <p class="order-date">${orderDate}</p>
            <div class="order-details">
                ${detailsHTML}
            </div>
            <span class="order-total">Total: $${order.total.toFixed(2)}</span>
            <span class="status ${order.state.toLowerCase()}">${STATE_LABELS[order.state]}</span>
        `;

        ordersContainer.appendChild(orderCard);
    });
}

//----- CARGAR ÓRDENES -----
async function fetchOrders(): Promise<void> {
    if (!storeUser || !storeUser.id) {
        console.error("No se encontró el ID del usuario");
        return;
    }

    try {
        const orders = await apiFetch<IOrder[]>(
            `${API_BASE}/orders/users/${storeUser.id}`,
            { method: "GET" }
        );
        renderOrders(orders);
    } catch (error) {
        console.error("Error al obtener órdenes:", error);
    }
}

//----- INICIAR -----
fetchOrders();
