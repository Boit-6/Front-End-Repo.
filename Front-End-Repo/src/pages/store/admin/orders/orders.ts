import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import { showToast } from "../../../../utils/toast";
import { apiFetch, apiDeleteWithConfirm } from "../../../../utils/api";
import { openModal, closeModal } from "../../../../utils/modal";
import { adjustHeaderLinks, showUserName } from "../../../../utils/service";
import type { IOrder, state } from "../../../../types/IOrders";

/*
    Panel de administración — Gestión de pedidos
    - Carga y render de los pedidos
    - Ver detalle, editar estado y eliminar pedidos
    - Protecciones: no permitir editar pedidos cancelados
*/

showUserName();
checkAuthUser("ADMIN", LOGIN_ROUTE);
adjustHeaderLinks();

// Constantes
const STATES: state[] = ["PENDING", "CONFIRMED", "CANCELED", "FINISHED"];
const API_BASE = "http://localhost:8080";

// Logout
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());

/* ---------- CARGAR ÓRDENES ---------- */
async function loadOrders() {
    try {
        const orders = await apiFetch<IOrder[]>(`${API_BASE}/orders`, { method: "GET" });
        if (!orders || orders.length === 0) {
            showToast("No hay pedidos disponibles", "info");
            return;
        }

        renderOrders(orders);
    } catch (error) {
        console.error("Error al cargar órdenes:", error);
        showToast("Error al cargar los pedidos", "error");
    }
}

/* Renderiza la lista de pedidos en la pantalla */
function renderOrders(orders: IOrder[]) {
    const tableContainer = document.querySelector(".table-container") as HTMLDivElement;
    tableContainer.innerHTML = `<div class="orders-container"></div>`;
    const list = tableContainer.querySelector(".orders-container") as HTMLDivElement;

    orders.forEach(order => list.appendChild(createOrderCard(order)));
}

/* Crea la tarjeta (card) que representa un pedido */
function createOrderCard(order: IOrder): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "order-card";

    const detailsText = order.details
        .map(d => `${d.product.name} x ${d.amount}`)
        .join(" · ");

    const createdAtText = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date;

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3>Pedido #${order.id}</h3>
                <div class="order-date">${createdAtText}</div>
            </div>
            <div style="text-align:right">
                <div class="status ${order.state.toLowerCase()}">${order.state}</div>
                <div class="order-total">$${order.total.toFixed(2)}</div>
            </div>
        </div>
        <div class="order-details">${detailsText}</div>
        <div style="display:flex; gap:0.5rem; margin-top:8px;">
            <button class="btn-edit">Editar</button>
            <button class="btn-view">Ver</button>
            <button class="btn-delete">Eliminar</button>
        </div>
    `;

    // Listeners de acciones (ver, editar, eliminar)
    const btnEdit = card.querySelector(".btn-edit") as HTMLButtonElement;
    const btnView = card.querySelector(".btn-view") as HTMLButtonElement;
    const btnDelete = card.querySelector(".btn-delete") as HTMLButtonElement;

    btnView.addEventListener("click", () => showDetailsModal(order));
        // Si el pedido ya está CANCELADO, no permitir editar el estado
        if (order.state === 'CANCELED') {
            btnEdit.disabled = true;
            btnEdit.title = 'Pedido cancelado — no se puede cambiar el estado';
        } else {
            btnEdit.addEventListener("click", () => showEditModal(order));
        }
    btnDelete.addEventListener("click", async () => {
        await apiDeleteWithConfirm(
            `${API_BASE}/orders/delete/${order.id}`,
            `¿Eliminar pedido #${order.id}?`,
            "Pedido eliminado"
        );
        loadOrders();
    });

    return card;
}

/* Mostrar modal con los detalles del pedido */
function showDetailsModal(order: IOrder) {
    const modal = document.getElementById("modalViewDetails") as HTMLDivElement;
    const orderDetailId = document.getElementById("orderDetailId") as HTMLSpanElement;
    const detailsTableBody = document.getElementById("orderDetailsTableBody") as HTMLTableSectionElement;

    orderDetailId.textContent = order.id.toString();
    detailsTableBody.innerHTML = "";

    order.details.forEach(detail => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${detail.product.name}</td>
            <td>${detail.amount}</td>
            <td>$${detail.subtotal.toFixed(2)}</td>
        `;
        detailsTableBody.appendChild(tr);
    });

    openModal(modal);

    // Cierre del modal al pulsar fuera o el botón de cerrar
    const closeBtn = document.getElementById("closeModalViewDetails") as HTMLButtonElement;
    closeBtn.onclick = () => closeModal(modal);
    modal.onclick = (e) => { if (e.target === modal) closeModal(modal); };
}

/* Mostrar modal para editar el estado del pedido */
function showEditModal(order: IOrder) {
    const modal = document.getElementById("modalEditOrder") as HTMLDivElement;
    const stateSelect = document.getElementById("editOrderState") as HTMLSelectElement;
    const form = document.getElementById("orderFormEdit") as HTMLFormElement;

    // Si el pedido ya está cancelado, no permitir abrir el modal de edición
    if (order.state === 'CANCELED') {
        showToast('Pedido cancelado — no se puede cambiar el estado', 'warning');
        return;
    }

    // Poblamos el select con los estados disponibles
    stateSelect.innerHTML = "";
    STATES.forEach(stateOption => {
        const option = document.createElement("option");
        option.value = stateOption;
        option.textContent = stateOption;
        stateSelect.appendChild(option);
    });

    stateSelect.value = order.state;
    openModal(modal);

    // Cierre del modal (botón y clic fuera)
    const closeBtn = document.getElementById("closeModalOrderEdit") as HTMLButtonElement;
    closeBtn.onclick = () => { closeModal(modal); form.reset(); };
    modal.onclick = (e) => { if (e.target === modal) { closeModal(modal); form.reset(); } };

    // Reemplazamos el formulario para eliminar listeners previos
    const newForm = form.cloneNode(true) as HTMLFormElement;
    form.parentNode?.replaceChild(newForm, form);

    // Envío del formulario para actualizar el estado
    newForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const selectedState = (newForm.querySelector("#editOrderState") as HTMLSelectElement)
            .value as state;

        try {
            await apiFetch(
                `${API_BASE}/orders/edit/${order.id}`,
                { method: "PUT", body: { id: order.id, state: selectedState } },
                { successMessage: "Estado de pedido actualizado" }
            );
            closeModal(modal);
            newForm.reset();
            loadOrders();
        } catch (error) {
            console.error("Error al actualizar orden:", error);
        }
    });
}

// Inicializa la carga de pedidos al entrar en la página
loadOrders();
