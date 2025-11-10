import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import type { IOrder, state } from "../../../../types/IOrders"; // Importamos 'state' para el select
import { showUserName } from "../../../../utils/service";
showUserName();

//----- CONSTANTS -----
const STATES: state[] = ["PENDING", "CONFIRMED", "CANCELED", "FINISHED"]; // Posibles estados

//----- CHECK AUTH USER -----
checkAuthUser("ADMIN", LOGIN_ROUTE);

//----- LOGOUT BUTTON -----
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => {
    logoutUser();
});

//----- FUNCTION TO RENDER ORDERS -----
try {
    try {
        //----- GET ORDERS -----
        const response = await fetch("http://localhost:8080/orders", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener los pedidos");
        }

        
        const orders: IOrder[] = await response.json();

        //----- TABLE CONTAINER -----
        const tableContainer = document.querySelector(".table-container") as HTMLDivElement;

        tableContainer.innerHTML = `
        <table class="category-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Total</th>
                    <th>Tipo de entrega</th>
                    <th>Método de Pago</th>
                    <th>Estado</th>
                    <th>Detalles</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;
        const tbody = tableContainer.querySelector("tbody") as HTMLTableSectionElement;
        tbody.innerHTML = "";

        //----- RENDER ORDERS -----
        orders.forEach((order) => {
            const tr = document.createElement("tr");

            //----- ORDER ID -----
            const tdID = document.createElement("td");
            tdID.innerText = order.id.toString();
            tr.appendChild(tdID);

            //----- TOTAL -----
            const tdTotal = document.createElement("td");
            tdTotal.innerText = `$${order.total.toFixed(2)}`;
            tr.appendChild(tdTotal);

            //----- DELIVERY TYPE (Tipo de entrega) -----
            const tdDelivery = document.createElement("td");
            tdDelivery.innerText = order.delivery;
            tr.appendChild(tdDelivery);

            //----- PAYMENT METHOD (Metodo de Pago) -----
            const tdPayment = document.createElement("td");
            tdPayment.innerText = order.payment;
            tr.appendChild(tdPayment);

            //----- STATE (Estado) -----
            const tdStatus = document.createElement("td");
            tdStatus.innerText = order.state;
            tr.appendChild(tdStatus);

            //----- ORDER DETAILS (Detalle de pedido) -----
            const tdDetails = document.createElement("td");
            
            // Construir el HTML con cada detalle separado por <br>
            const detailsHtml = order.details.map(detail => {
                    return `Producto: ${detail.product.name} (Cant: ${detail.amount})`;
            }).join('<br>'); // Usar <br> para listarlos uno debajo del otro

            tdDetails.innerHTML = detailsHtml;
            tr.appendChild(tdDetails);

            //----- ORDER ACTIONS -----
            const tdActions = document.createElement("td");
            const actionsDiv = document.createElement("div");
            actionsDiv.classList.add("actions");

            //----- EDIT ORDER (Solo estado) -----
            const btnEdit = document.createElement("button");
            btnEdit.innerText = "Editar";
            btnEdit.classList.add("btn-edit");
            btnEdit.addEventListener("click", () => {
                showEditModal(order);
            });

            //----- DELETE ORDER -----
            const btnDelete = document.createElement("button");
            btnDelete.innerText = "Eliminar";
            btnDelete.classList.add("btn-delete");
            btnDelete.addEventListener("click", async () => {
                if (confirm(`¿Estás seguro de que quieres eliminar el pedido #${order.id}?`)) {
                    await deleteOrder(order.id);
                }
            });

            actionsDiv.appendChild(btnEdit);
            actionsDiv.appendChild(btnDelete);
            tdActions.appendChild(actionsDiv);
            tr.appendChild(tdActions);
            tbody.appendChild(tr);
            
        });
    } catch (error) {
        console.error("Error al conectar con el servidor o renderizar pedidos:", error);
    }
}catch (error) {
    console.error("Error al conectar con el servidor o renderizar pedidos:", error);
    }

//----- SHOW DETAILS MODAL FUNCTION -----
function showDetailsModal(order: IOrder) {
    const modalViewDetails = document.getElementById("modalViewDetails") as HTMLDivElement;
    const orderDetailId = document.getElementById("orderDetailId") as HTMLSpanElement;
    const detailsTableBody = document.getElementById("orderDetailsTableBody") as HTMLTableSectionElement;
    const closeModal = document.getElementById("closeModalViewDetails") as HTMLButtonElement;

    orderDetailId.textContent = order.id.toString();
    detailsTableBody.innerHTML = ""; // Limpiar detalles anteriores

    order.details.forEach(detail => {
        const tr = document.createElement("tr");

        const tdProductId = document.createElement("td");
        tdProductId.innerText = detail.product.toString();
        tr.appendChild(tdProductId);

        const tdAmount = document.createElement("td");
        tdAmount.innerText = detail.amount.toString();
        tr.appendChild(tdAmount);

        const tdSubtotal = document.createElement("td");
        tdSubtotal.innerText = `$${detail.subtotal.toFixed(2)}`;
        tr.appendChild(tdSubtotal);

        detailsTableBody.appendChild(tr);
    });

    modalViewDetails.classList.remove("hidden");
    
    closeModal.onclick = () => {
        modalViewDetails.classList.add("hidden");
    };
    // Manejar clic fuera del modal para cerrarlo
    modalViewDetails.onclick = (e) => {
        if (e.target === modalViewDetails) {
            modalViewDetails.classList.add("hidden");
        }
    };
}


//----- SHOW EDIT MODAL FUNCTION -----
function showEditModal(order: IOrder) {
    const modalEditOverlay = document.getElementById("modalEditOrder") as HTMLDivElement;
    const modalEditOrderStateSelect = document.getElementById("editOrderState") as HTMLSelectElement;
    const modalFormEdit = document.getElementById("orderFormEdit") as HTMLFormElement;
    const closeModal = document.getElementById("closeModalOrderEdit") as HTMLButtonElement;

    //----- POPULATE STATE SELECT -----
    modalEditOrderStateSelect.innerHTML = '';
    STATES.forEach((stateOption) => {
        const option = document.createElement("option");
        option.value = stateOption;
        option.textContent = stateOption;
        modalEditOrderStateSelect.appendChild(option);
    });

    //----- PREFILL EDIT MODAL -----
    modalEditOrderStateSelect.value = order.state;
    modalEditOverlay.classList.remove("hidden");

    //----- CLOSE EDIT MODAL -----
    closeModal.onclick = () => {
        modalEditOverlay.classList.add("hidden");
        modalFormEdit.reset();
    };
    modalEditOverlay.onclick = (e) => {
        if (e.target === modalEditOverlay) {
            modalEditOverlay.classList.add("hidden");
        }
    };
    
    // Quitar listeners anteriores para evitar múltiples envíos
    const newFormEdit = modalFormEdit.cloneNode(true) as HTMLFormElement;
    modalFormEdit.parentNode?.replaceChild(newFormEdit, modalFormEdit);

    //----- SAVE EDITED ORDER -----
    newFormEdit.addEventListener("submit", async (event) => {
        event.preventDefault();

        try {
            const selectedState = (newFormEdit.querySelector("#editOrderState") as HTMLSelectElement).value as state;
            
            const response = await fetch(`http://localhost:8080/orders/edit/${order.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: order.id,
                    state: selectedState,
                }),
            });

            if (!response.ok) {
                return;
            }

            modalEditOverlay.classList.add("hidden");
            location.reload();
        } catch (err) {
            console.error("Error al conectar con el servidor al editar:", err);
        }
    });
}

//----- DELETE ORDER FUNCTION -----
async function deleteOrder(orderId: number) {
    try {
        const response = await fetch(`http://localhost:8080/orders/delete/${orderId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el pedido");
        }

        location.reload();
    } catch (err) {
        console.error("Error al conectar con el servidor al eliminar:", err);
    }
}
