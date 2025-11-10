import { logoutUser, checkAuthUser } from "../../../../utils/auth";
import { LOGIN_ROUTE } from "../../../../utils/navigate";
import type { IProduct } from "../../../../types/IProducts";
import { showUserName } from "../../../../utils/service";
showUserName();

//----- CHECK AUTH USER -----
checkAuthUser("ADMIN", LOGIN_ROUTE);

//----- LOGOUT BUTTON -----
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => {
    logoutUser();
});



try {
    //----- GET PRODUCTS -----
    const response = await fetch("http://localhost:8080/product/admin", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error("Error al obtener los productos");
    }

    const products: IProduct[] = await response.json();

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

    //----- RENDER PRODUCTS -----
    products.forEach((product) => {
        const tr = document.createElement("tr");

        //----- PRODUCT ID -----
        const tdID = document.createElement("td");
        tdID.innerText = product.id.toString();
        tr.appendChild(tdID);

        //----- PRODUCT IMAGE -----
        const tdImage = document.createElement("td");
        const img = document.createElement("img");
        img.src = product.urlImg;
        img.classList.add("cat-img");
        tdImage.appendChild(img);
        tr.appendChild(tdImage);

        //----- PRODUCT NAME -----
        const tdName = document.createElement("td");
        tdName.innerText = product.name;
        tr.appendChild(tdName);

        //----- PRODUCT DESCRIPTION -----
        const tdDescription = document.createElement("td");
        tdDescription.innerText = product.description;
        tr.appendChild(tdDescription);

        //----- PRODUCT PRICE -----
        const tdPrice = document.createElement("td");
        tdPrice.innerText = product.price.toString();
        tr.appendChild(tdPrice);

        //----- PRODUCT CATEGORY -----
        const tdCategory = document.createElement("td");
        tdCategory.innerText = product.category.name || "Categoría no asignada";
        tr.appendChild(tdCategory);

        //----- PRODUCT STOCK -----
        const tdStock = document.createElement("td");
        tdStock.innerText = product.stock.toString();
        tr.appendChild(tdStock);

        //----- PRODUCT STATUS -----
        const tdStatus = document.createElement("td");
        tdStatus.innerText = product.availableProduct ? "Activo" : "Inactivo";
        tr.appendChild(tdStatus);

        //----- PRODUCT ACTIONS -----
        const tdActions = document.createElement("td"); 
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("actions");

        //----- EDIT PRODUCT -----
        const btnEdit = document.createElement("button");
        btnEdit.innerText = "Editar";
        btnEdit.classList.add("btn-edit");
        btnEdit.addEventListener("click", () => {
            const modalEditOverlay = document.getElementById("modalEditProduct") as HTMLDivElement;
            const modalEditProductNameInput = document.getElementById("editProductName") as HTMLInputElement;
            const modalEditProductDescriptionInput = document.getElementById("editProductDescription") as HTMLTextAreaElement;
            const modalEditProductImageInput = document.getElementById("editProductImage") as HTMLInputElement;
            const modalFormEdit = document.getElementById("productFormEdit") as HTMLFormElement;
            const closeModal = document.getElementById("closeModalProductEdit") as HTMLButtonElement;
            const modalEditProductPriceInput = document.getElementById("editProductPrice") as HTMLInputElement;
            const modalEditProductCategorySeleect = document.getElementById("editProductCategory") as HTMLSelectElement;
            const modalEditProductStockInput = document.getElementById("editProductStock") as HTMLInputElement;
            const modalEditProductStatusInput = document.getElementById("editProductStatus") as HTMLSelectElement;

            //----- SHOW EDIT MODAL -----
            modalEditOverlay.classList.remove("hidden");

            modalEditProductCategorySeleect.innerHTML = '<option value="">Seleccionar categoría</option>';

            // Cargar categorías para el modal de edición
            (async () => {
                try {
                    const res = await fetch("http://localhost:8080/category", {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    });
                    if (!res.ok) throw new Error("Error al obtener categorías");
                    const categories: { id: number; name: string }[] = await res.json();
                    categories.forEach((cat) => {
                        const option = document.createElement("option");
                        option.value = String(cat.id);
                        option.textContent = cat.name;
                        modalEditProductCategorySeleect.appendChild(option);
                    });
                    // Preseleccionar la categoría actual
                    if (product.category && typeof product.category.id !== "undefined") {
                        modalEditProductCategorySeleect.value = String(product.category.id);
                    }
                } catch (e) {
                    console.error("Error al cargar categorías (editar):", e);
                }
            })();

            //----- PREFILL EDIT MODAL -----
            modalEditProductNameInput.value = product.name;
            modalEditProductDescriptionInput.value = product.description;
            modalEditProductImageInput.value = product.urlImg;
            modalEditProductPriceInput.value = product.price.toString();
            // La categoría se preselecciona tras cargar opciones arriba
            modalEditProductStockInput.value = product.stock.toString();
            modalEditProductStatusInput.value = product.availableProduct ? "true" : "false";
            modalFormEdit.reset();

            //----- CLOSE EDIT MODAL -----
            closeModal.addEventListener("click", () => {
                modalEditOverlay.classList.add("hidden");
                modalFormEdit.reset();
            });

            //----- SAVE EDITED PRODUCT -----
            modalFormEdit.addEventListener("submit", async (event) => {
                event.preventDefault();

                try {
                    const response = await fetch(`http://localhost:8080/product/edit/${product.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: product.id.toString(),
                            name: modalEditProductNameInput.value.trim(),
                            description: modalEditProductDescriptionInput.value.trim(),
                            urlImg: modalEditProductImageInput.value.trim(),
                            price: parseFloat(modalEditProductPriceInput.value),
                            categoryId: parseInt(modalEditProductCategorySeleect.value),
                            stock: parseInt(modalEditProductStockInput.value),
                            availableProduct: modalEditProductStatusInput.value === "true",
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

        //----- DELETE PRODUCT -----
        const btnDelete = document.createElement("button");
        btnDelete.innerText = "Eliminar";
        btnDelete.classList.add("btn-delete");
        btnDelete.addEventListener("click", async () => {
            await fetch(`http://localhost:8080/product/delete/${product.id}`, {
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
} catch (error) {
    console.error("Error al conectar con el servidor:", error);
}

//----- CREATE PRODUCT MODAL ELEMENTS -----
const btnAddProduct = document.getElementById("btnAddProduct") as HTMLButtonElement;
const modalOverlay = document.getElementById("modalCreateProduct") as HTMLDivElement;
const modalForm = document.getElementById("productForm") as HTMLFormElement;
const closeModal = document.getElementById("closeModalProduct") as HTMLButtonElement;
const saveBtn = document.getElementById("btnSaveProduct") as HTMLButtonElement;

//----- SHOW CREATE PRODUCT MODAL -----
btnAddProduct.addEventListener("click", async () => {
    modalOverlay.classList.remove("hidden");
    modalForm.reset();

    // ----- CARGAR CATEGORÍAS EN EL SELECT -----
    const categorySelect = document.getElementById("productCategory") as HTMLSelectElement;
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';

    try {
        const res = await fetch("http://localhost:8080/category", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Error al obtener categorías");

        const categories = await res.json();
        categories.forEach((cat: { id: number; name: string }) => {
            const option = document.createElement("option");
            option.value = String(cat.id);
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
});

//----- CLOSE CREATE PRODUCT MODAL -----
closeModal.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
    modalForm.reset();
});

//----- SAVE NEW PRODUCT -----
saveBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    //----- GET INPUT VALUES -----
    const nameInput = document.getElementById("productName") as HTMLInputElement;
    const descriptionInput = document.getElementById("productDescription") as HTMLTextAreaElement;
    const imageInput = document.getElementById("productImage") as HTMLInputElement;
    const priceInput = document.getElementById("productPrice") as HTMLInputElement;
    const categoryInput = document.getElementById("productCategory") as HTMLSelectElement;
    const stockInput = document.getElementById("productStock") as HTMLInputElement;
    const statusSelect = document.getElementById("productStatus") as HTMLSelectElement;

    console.log(typeof(nameInput.value.trim()));
    console.log(typeof(descriptionInput.value.trim()));
    console.log(typeof(imageInput.value.trim()));
    console.log(typeof(parseFloat(priceInput.value)));
    console.log(typeof(parseInt(categoryInput.value)));
    console.log(typeof(parseInt(stockInput.value)));
    console.log(typeof(statusSelect.value));

    try {
        const response = await fetch("http://localhost:8080/product/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                            name: nameInput.value.trim(),
                            description: descriptionInput.value.trim(),
                            urlImg: imageInput.value.trim(),
                            price: parseFloat(priceInput.value),
                            categoryId: parseInt(categoryInput.value),
                            stock: parseInt(stockInput.value),
                            availableProduct: statusSelect.value === 'true',
            }),
        });

        if (!response.ok) {
            return;
        }

        modalOverlay.classList.add("hidden");
        modalForm.reset();
        location.reload();

    } catch (err) {
        console.error("Error al conectar con el servidor:", err);
    }
});
