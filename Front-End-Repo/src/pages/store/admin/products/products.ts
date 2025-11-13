import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import { showToast } from "../../../../utils/toast";
import { apiFetch, apiDeleteWithConfirm } from "../../../../utils/api";
import { openModal, closeModal } from "../../../../utils/modal";
import { adjustHeaderLinks, showUserName } from "../../../../utils/service";
import type { IProduct } from "../../../../types/IProducts";

/*
    Panel admin — Gestión de productos
    - Carga, listado y CRUD de productos
    - Formularios en modales para crear/editar
*/

showUserName();
checkAuthUser("ADMIN", LOGIN_ROUTE);
adjustHeaderLinks();

const API_BASE = "http://localhost:8080";

// Logout
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());



/* ---------- CARGAR PRODUCTOS ---------- */
async function loadProducts() {
    try {
        const products = await apiFetch<IProduct[]>(`${API_BASE}/product/admin`, {
            method: "GET" 
        });
        if (!products || products.length === 0) {
            showToast("No hay productos disponibles", "info");
            return;
        }

        renderProductsTable(products);
    } catch (error) {
        console.error("Error al cargar productos:", error);
        showToast("Error al cargar los productos", "error");
    }
}

/* Render de la tabla de productos */
function renderProductsTable(products: IProduct[]) {
    const tableContainer = document.querySelector(".table-container") as HTMLDivElement;

    tableContainer.innerHTML = `
        <table class="category-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    const tbody = tableContainer.querySelector("tbody") as HTMLTableSectionElement;
    products.forEach(product => {
        const tr = createProductRow(product);
        tbody.appendChild(tr);
    });
}

/* Crear fila en la tabla para cada producto */
function createProductRow(product: IProduct): HTMLTableRowElement {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${product.id}</td>
        <td><img src="${product.urlImg}" class="cat-img"></td>
        <td>${product.name}</td>
        <td>${product.description}</td>
        <td>$${product.price}</td>
        <td>${product.category?.name || "Categoría no asignada"}</td>
        <td>${product.stock}</td>
        <td>${product.availableProduct ? "Activo" : "Inactivo"}</td>
        <td>
            <div class="actions">
                <button class="btn-edit">Editar</button>
                <button class="btn-delete">Eliminar</button>
            </div>
        </td>
    `;

    const btnEdit = tr.querySelector(".btn-edit") as HTMLButtonElement;
    const btnDelete = tr.querySelector(".btn-delete") as HTMLButtonElement;

    btnEdit.addEventListener("click", () => showEditModal(product));
    btnDelete.addEventListener("click", async () => {
        await apiDeleteWithConfirm(
            `${API_BASE}/product/delete/${product.id}`,
            `¿Eliminar producto "${product.name}"?`,
            "Producto eliminado"
        );
        loadProducts();
    });

    return tr;
}

/* Mostrar modal para editar un producto */
async function showEditModal(product: IProduct) {
    const modal = document.getElementById("modalEditProduct") as HTMLDivElement;
    const form = document.getElementById("productFormEdit") as HTMLFormElement;
    const categorySelect = document.getElementById("editProductCategory") as HTMLSelectElement;

    // Cargar categorías disponibles en el select
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    try {
        const categories = await apiFetch<{ id: number; name: string }[]>(
            `${API_BASE}/category`,
            { method: "GET" }
        );
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = String(cat.id);
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
        if (product.category?.id) {
            categorySelect.value = String(product.category.id);
        }
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }

    // Prefill: asignar valores actuales al formulario de edición
    const nameInput = document.getElementById("editProductName") as HTMLInputElement;
    const descInput = document.getElementById("editProductDescription") as HTMLTextAreaElement;
    const imgInput = document.getElementById("editProductImage") as HTMLInputElement;
    const priceInput = document.getElementById("editProductPrice") as HTMLInputElement;
    const stockInput = document.getElementById("editProductStock") as HTMLInputElement;
    const statusInput = document.getElementById("editProductStatus") as HTMLSelectElement;

    nameInput.value = product.name;
    descInput.value = product.description;
    imgInput.value = product.urlImg;
    priceInput.value = String(product.price);
    stockInput.value = String(product.stock);
    statusInput.value = product.availableProduct ? "true" : "false";

    openModal(modal);

    // Cierre del modal (botón y clic fuera)
    const closeBtnEdit = document.getElementById("closeModalProductEdit") as HTMLButtonElement;
    closeBtnEdit.onclick = () => { closeModal(modal); form.reset(); };
    modal.onclick = (e) => { if (e.target === modal) { closeModal(modal); form.reset(); } };

    // Reemplazar el formulario para quitar listeners previos
    const newForm = form.cloneNode(true) as HTMLFormElement;
    form.parentNode?.replaceChild(newForm, form);

    // Envío del formulario de edición
    newForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            // Re-query inputs from the cloned form to get user-updated values
            const nameEl = newForm.querySelector("#editProductName") as HTMLInputElement;
            const descEl = newForm.querySelector("#editProductDescription") as HTMLTextAreaElement;
            const imgEl = newForm.querySelector("#editProductImage") as HTMLInputElement;
            const priceEl = newForm.querySelector("#editProductPrice") as HTMLInputElement;
            const stockEl = newForm.querySelector("#editProductStock") as HTMLInputElement;
            const statusEl = newForm.querySelector("#editProductStatus") as HTMLSelectElement;
            const categoryEl = newForm.querySelector("#editProductCategory") as HTMLSelectElement;

            const payload = {
                id: product.id.toString(),
                name: nameEl.value.trim(),
                description: descEl.value.trim(),
                urlImg: imgEl.value.trim(),
                price: parseFloat(priceEl.value),
                categoryId: parseInt(categoryEl.value),
                stock: parseInt(stockEl.value),
                availableProduct: statusEl.value === "true"
            };

            await apiFetch(
                `${API_BASE}/product/edit/${product.id}`,
                {
                    method: "PUT",
                    body: payload
                },
                { successMessage: "Producto editado" }
            );
            closeModal(modal);
            newForm.reset();
            loadProducts();
        } catch (error) {
            console.error("Error al actualizar producto:", error);
        }
    });
}

/* ---------- CREAR PRODUCTO (MODAL) ---------- */
const btnAddProduct = document.getElementById("btnAddProduct") as HTMLButtonElement;
const createModal = document.getElementById("modalCreateProduct") as HTMLDivElement;
const createForm = document.getElementById("productForm") as HTMLFormElement;
const saveBtn = document.getElementById("btnSaveProduct") as HTMLButtonElement;

// Mostrar modal de creación
btnAddProduct.addEventListener("click", async () => {
    const categorySelect = document.getElementById("productCategory") as HTMLSelectElement;
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';

    try {
        const categories = await apiFetch<{ id: number; name: string }[]>(
            `${API_BASE}/category`,
            { method: "GET" }
        );
        categories.forEach(cat => {
            const option = document.createElement("option");
            option.value = String(cat.id);
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }

    openModal(createModal);
    createForm.reset();
});

// Cierre del modal de creación
const closeBtnCreate = document.getElementById("closeModalProduct") as HTMLButtonElement;
closeBtnCreate.onclick = () => { closeModal(createModal); createForm.reset(); };
createModal.onclick = (e) => { if (e.target === createModal) { closeModal(createModal); createForm.reset(); } };

// Envío creación de producto
saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("productName") as HTMLInputElement;
    const descInput = document.getElementById("productDescription") as HTMLTextAreaElement;
    const imgInput = document.getElementById("productImage") as HTMLInputElement;
    const priceInput = document.getElementById("productPrice") as HTMLInputElement;
    const categoryInput = document.getElementById("productCategory") as HTMLSelectElement;
    const stockInput = document.getElementById("productStock") as HTMLInputElement;
    const statusSelect = document.getElementById("productStatus") as HTMLSelectElement;

    try {
        await apiFetch(
            `${API_BASE}/product/create`,
            {
                method: "POST",
                body: {
                    name: nameInput.value.trim(),
                    description: descInput.value.trim(),
                    urlImg: imgInput.value.trim(),
                    price: parseFloat(priceInput.value),
                    categoryId: parseInt(categoryInput.value),
                    stock: parseInt(stockInput.value),
                    availableProduct: statusSelect.value === "true"
                }
            },
            { successMessage: "Producto creado" }
        );
        closeModal(createModal);
        createForm.reset();
        loadProducts();
    } catch (error) {
        console.error("Error al crear producto:", error);
    }
});

// Inicializar lista al cargar la página
loadProducts();
