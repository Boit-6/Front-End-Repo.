import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import type { ICategory } from "../../../../types/ICategories";
import { showUserName } from "../../../../utils/service";

showUserName();


//----- CHECK AUTH USER -----
checkAuthUser("ADMIN", LOGIN_ROUTE);

//----- LOGOUT BUTTON -----
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => {
    logoutUser();
});

//----- SET USER NAME IN HEADER -----
try {
    const raw = localStorage.getItem("userData");
    if (raw) {
        const user = JSON.parse(raw) as { name?: string; last_Name?: string; email?: string };
        const displayName = [user.name, user.last_Name].filter(Boolean).join(" ") || (user.email || "");
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = displayName;
    }
} catch {}

try {
    //----- GET CATEGORIES -----
    const response = await fetch("http://localhost:8080/category", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener las categorías");
    }

    const categories: ICategory[] = await response.json();

    //----- TABLE CONTAINER -----
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

    //----- RENDER CATEGORIES -----
    categories.forEach((category) => {
        const tr = document.createElement("tr");

        //----- CATEGORY ID -----
        const tdID = document.createElement("td");
        tdID.innerText = category.id.toString();
        tr.appendChild(tdID);

        //----- CATEGORY IMAGE -----
        const tdImage = document.createElement("td");
        const img = document.createElement("img");
        img.src = category.url;
        img.classList.add("cat-img");
        tdImage.appendChild(img);
        tr.appendChild(tdImage);

        //----- CATEGORY NAME -----
        const tdName = document.createElement("td");
        tdName.innerText = category.name;
        tr.appendChild(tdName);

        //----- CATEGORY DESCRIPTION -----
        const tdDescription = document.createElement("td");
        tdDescription.innerText = category.description;
        tr.appendChild(tdDescription);

        //----- CATEGORY ACTIONS -----
        const tdActions = document.createElement("td");
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("actions");

        //----- EDIT CATEGORY -----
        const btnEdit = document.createElement("button");
        btnEdit.innerText = "Editar";
        btnEdit.classList.add("btn-edit");
        btnEdit.addEventListener("click", () => {
            const modalEditOverlay = document.getElementById("modalEditCategory") as HTMLDivElement;
            const modalEditCategoryNameInput = document.getElementById("editCategoryName") as HTMLInputElement;
            const modalEditCategoryDescriptionInput = document.getElementById("editCategoryDescription") as HTMLTextAreaElement;
            const modalEditCategoryImageInput = document.getElementById("editCategoryImage") as HTMLInputElement;
            const modalFormEdit = document.getElementById("categoryFormEdit") as HTMLFormElement;
            const closeModal = document.getElementById("closeModalEdit") as HTMLButtonElement;
            const saveEditBtn = document.getElementById("saveEditBtn") as HTMLButtonElement;

            //----- MOSTRAR EDIT MODAL -----
            modalEditOverlay.classList.remove("hidden");
            modalFormEdit.reset();

            //----- CERRAR EDIT MODAL -----
            closeModal.addEventListener("click", () => {
                modalEditOverlay.classList.add("hidden");
                modalFormEdit.reset();
            });

            //----- GUARDAMOS EDITED CATEGORY -----
            saveEditBtn.addEventListener("click", async () => {
                try {
                    const response = await fetch(`http://localhost:8080/category/edit/${category.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: category.id,
                            name: modalEditCategoryNameInput.value,
                            description: modalEditCategoryDescriptionInput.value,
                            url: modalEditCategoryImageInput.value,
                        }),
                    });

                    if (!response.ok) {
                        return;
                    }

                    modalEditOverlay.classList.add("hidden");
                    location.reload();
                } catch (err) {
                    console.error("Error al conectar con el servidor:", err);
                }
            });
        });

        //----- BORRAR CATEGORY -----
        const btnDelete = document.createElement("button");
        btnDelete.innerText = "Eliminar";
        btnDelete.classList.add("btn-delete");
        btnDelete.addEventListener("click", async () => {
            await fetch(`http://localhost:8080/category/delete/${category.id}`, {
                method: "DELETE",
            });
            location.reload();
        });

        actionsDiv.appendChild(btnEdit);
        actionsDiv.appendChild(btnDelete);
        tdActions.appendChild(actionsDiv);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
} catch (err) {
    throw new Error(err as string);
}

//----- CREAR CATEGORY MODAL ELEMENTS -----
const modalOverlay = document.getElementById("modalCreateCategory") as HTMLDivElement;
const btnAddModal = document.getElementById("btnAddCategory") as HTMLButtonElement;
const btnCloseModal = document.getElementById("closeModal") as HTMLButtonElement;
const formModal = document.getElementById("categoryForm") as HTMLFormElement;
const categoryNameInputModal = document.getElementById("categoryName") as HTMLInputElement;
const categoryDescriptionInputModal = document.getElementById("categoryDescription") as HTMLTextAreaElement;
const categoryImageInputModal = document.getElementById("categoryImage") as HTMLInputElement;

//----- MOSTRAR CREATE CATEGORY MODAL -----
btnAddModal.addEventListener("click", () => {
    modalOverlay.classList.remove("hidden");
});

//----- CERRAR CREATE CATEGORY MODAL -----
btnCloseModal.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
});

//----- ENVIAMOS CREATE CATEGORY FORM SUBMIT -----
formModal.addEventListener("submit", async (e) => {
    e.preventDefault();

    const categoryName = categoryNameInputModal.value;
    const categoryDescription = categoryDescriptionInputModal.value;
    const categoryImage = categoryImageInputModal.value.trim();

    const newCategory: ICategory = {
        id: 999, 
        name: categoryName,
        description: categoryDescription,
        url: categoryImage,
    };

    try {
        const response = await fetch("http://localhost:8080/category/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newCategory),
        });

        if (!response.ok) {
            return;
        }

        formModal.reset();
        modalOverlay.classList.add("hidden");
        location.reload();

    } catch (err) {
        alert("Error en el servidor");
    }
});
