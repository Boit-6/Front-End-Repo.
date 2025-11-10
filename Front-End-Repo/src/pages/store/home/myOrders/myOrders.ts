import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import { showUserName } from "../../../../utils/service";
import type { IUser } from "../../../../types/IUser";
import type { IOrder, IOrderDetail, state } from "../../../../types/IOrders";

showUserName();

//----- CHECK AUTH USER -----
checkAuthUser("USER", LOGIN_ROUTE);

//----- LOGOUT BUTTON -----
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => {
    logoutUser();
});

// Obtener el usuario almacenado en localStorage
const storeUserRaw = localStorage.getItem("userData");
const storeUser = JSON.parse(storeUserRaw) as Partial<IUser>;
console.log(storeUser.id);

//----- Contenedor de pedidos -----
const ordersContainer = document.getElementById("orders-container") as HTMLElement;

// Mapeo de estados para mostrar en la UI
const stateLabels: { [key in state]: string } = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CANCELED: "Cancelado",
    FINISHED: "Finalizado",
};

// Función para renderizar los pedidos
function renderOrders(orders: IOrder[]): void {
    // Limpiar el contenedor antes de agregar nuevos pedidos
    ordersContainer.innerHTML = "";

    // Recorrer los pedidos y agregarlos al contenedor
    orders.forEach((order) => {
        // Crear el contenedor del pedido
        const orderCard = document.createElement("div");
        orderCard.classList.add("order-card");

        // Formatear los detalles del pedido
        const detailsHTML = order.details
            .map(
                (detail: IOrderDetail) => `
                <span>
                    ${detail.product.name} (x${detail.amount}) - $${detail.subtotal.toFixed(2)}
                </span>
            `
            )
            .join("");

        // Generar el contenido HTML para cada pedido
        orderCard.innerHTML = `
            <h3>Pedido #${order.id}</h3>
            <p class="order-date">${order.date || "Sin fecha"}</p>
            <div class="order-details">
                ${detailsHTML}
            </div>
            <span class="order-total">Total: $${order.total.toFixed(2)}</span>
            <span class="status ${order.state.toLowerCase()}">${stateLabels[order.state]}</span>
        `;

        // Agregar la tarjeta al contenedor
        ordersContainer.appendChild(orderCard);
    });
}

// Función para obtener los pedidos del usuario
async function fetchOrders(): Promise<void> {
    if (!storeUser || !storeUser.id) {
        console.error("No se encontró el ID del usuario");
        return;
    }
console.log("ID del usuario: ", storeUser.id);
    try {
        const response = await fetch(`http://localhost:8080/orders/users/${storeUser.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });


        if (!response.ok) {
            console.error("Error al obtener los pedidos", response);
            return;
        }

        const orders: IOrder[] = await response.json();
        console.log("Datos recibidos del backend:", orders); // Verificar los datos
        renderOrders(orders);
    } catch (error) {
        console.error("Error al realizar la solicitud", error);
    }
}


// Llamar a la función para obtener y renderizar los pedidos
fetchOrders();
