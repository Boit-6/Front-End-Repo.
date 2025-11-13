import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import type { ICategory } from "../../../../types/ICategories";
import { showUserName, adjustHeaderLinks } from "../../../../utils/service";
import { apiFetch, apiDeleteWithConfirm } from "../../../../utils/api";
import { openModal, closeModal, setupModalClosers } from "../../../../utils/modal";
import { getFormValues, fillForm } from "../../../../utils/form";

showUserName();
adjustHeaderLinks();

// Control de acceso: sólo admin puede ver esta página
checkAuthUser("ADMIN", LOGIN_ROUTE);

// Logout
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());

// Configuración básica de modales (selectores de cierre)
setupModalClosers({ modalSelector: '#modalEditCategory', closeSelector: '#closeModalEdit' });
setupModalClosers({ modalSelector: '#modalCreateCategory', closeSelector: '#closeModal' });

/* ---------- CARGAR Y RENDERIZAR CATEGORÍAS ---------- */
async function loadCategories() {
    try {
        const categories = await apiFetch<ICategory[]>(
            "http://localhost:8080/category",
            { method: "GET" },
            { showError: true }
        );

        const tableContainer = document.querySelector(".table-container") as HTMLDivElement;
        tableContainer.innerHTML = `
            <table class="category-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Imagen</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;

        const tbody = tableContainer.querySelector("tbody") as HTMLTableSectionElement;
        categories.forEach((category) => tbody.appendChild(renderCategoryRow(category)));
    } catch (err) {
        console.error("Error al cargar categorías:", err);
    }
}

/* Crea una fila de la tabla para una categoría */
function renderCategoryRow(category: ICategory): HTMLTableRowElement {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${category.id}</td>
        <td><img src="${category.url}" class="cat-img" alt="${category.name}"/></td>
        <td>${category.name}</td>
        <td>${category.description}</td>
        <td>
            <div class="actions">
                <button class="btn-edit" data-id="${category.id}">Editar</button>
                <button class="btn-delete" data-id="${category.id}">Eliminar</button>
            </div>
        </td>
    `;

    const btnEdit = tr.querySelector('.btn-edit') as HTMLButtonElement;
    const btnDelete = tr.querySelector('.btn-delete') as HTMLButtonElement;

    btnEdit.addEventListener('click', () => handleEditCategory(category));
    btnDelete.addEventListener('click', () => handleDeleteCategory(category));

    return tr;
}

/* ---------- EDICIÓN DE CATEGORÍA ---------- */
async function handleEditCategory(category: ICategory) {
    const modal = document.getElementById("modalEditCategory") as HTMLDivElement;
    const form = document.getElementById("categoryFormEdit") as HTMLFormElement;

    // Rellenar form con los datos actuales
    fillForm(form, {
        editCategoryName: category.name,
        editCategoryDescription: category.description,
        editCategoryImage: category.url
    });

    openModal(modal);

    // Reemplazar el formulario para evitar listeners previos
    const newForm = form.cloneNode(true) as HTMLFormElement;
    form.parentNode?.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const values = getFormValues(newForm);
            await apiFetch(
                `http://localhost:8080/category/edit/${category.id}`,
                {
                    method: 'PUT',
                    body: {
                        id: category.id,
                        name: values.editCategoryName,
                        description: values.editCategoryDescription,
                        url: values.editCategoryImage
                    }
                },
                { successMessage: 'Categoría actualizada' }
            );
            closeModal(modal);
            // Actualizar solo la sección de categorías
            await loadCategories();
        } catch (err) {
            console.error(err);
        }
    });
}

/* ---------- ELIMINAR CATEGORÍA ---------- */
async function handleDeleteCategory(category: ICategory) {
    try {
        await apiDeleteWithConfirm(
            `http://localhost:8080/category/delete/${category.id}`,
            `¿Eliminar categoría "${category.name}"?`,
            'Categoría eliminada'
        );
        await loadCategories();
    } catch (err) {
        console.error(err);
    }
}

/* ---------- CREAR CATEGORÍA (MODAL) ---------- */
const btnAddModal = document.getElementById("btnAddCategory") as HTMLButtonElement;
const btnCloseCreateModal = document.getElementById("closeModal") as HTMLButtonElement;
const formModal = document.getElementById("categoryForm") as HTMLFormElement;
const modalOverlay = document.getElementById("modalCreateCategory") as HTMLDivElement;

btnAddModal.addEventListener("click", () => {
    formModal.reset();
    openModal(modalOverlay);
});

btnCloseCreateModal.addEventListener("click", () => closeModal(modalOverlay, formModal));

formModal.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const values = getFormValues(formModal);
        await apiFetch(
            "http://localhost:8080/category/create",
            {
                method: "POST",
                body: {
                    id: 999,
                    name: values.categoryName,
                    description: values.categoryDescription,
                    url: values.categoryImage
                }
            },
            { successMessage: 'Categoría creada' }
        );
        closeModal(modalOverlay, formModal);
        await loadCategories();
    } catch (err) {
        console.error(err);
    }
});

// Cargar lista al iniciar la página
loadCategories();
