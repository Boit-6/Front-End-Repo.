import type { IProduct } from "../../../types/IProducts";
import type { ICategory } from "../../../types/ICategories";
import { logoutUser, checkAuthUser } from "../../../utils/auth";
import { LOGIN_ROUTE, PRODUCTS_DETAIL_ROUTE, navigate } from "../../../utils/navigate";
import { showUserName, adjustHeaderLinks } from "../../../utils/service";
import { apiFetch } from "../../../utils/api";

showUserName();
adjustHeaderLinks();
checkAuthUser("USER", LOGIN_ROUTE);

const API_BASE = "http://localhost:8080";

// Estado local
let products: IProduct[] = [];
let filteredProducts: IProduct[] = [];

// Logout
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());

// Marcar categoría activa en el listado
const setActive = (linkElement: HTMLElement) => {
    document.querySelectorAll(".categories-list li").forEach(li => li.classList.remove("active"));
    const parentLi = linkElement.closest("li");
    if (parentLi) parentLi.classList.add("active");
};

/* Renderizar grid de productos */
const renderProducts = (items: IProduct[]) => {
    const productGrid = document.querySelector(".product-grid") as HTMLDivElement;
    productGrid.innerHTML = "";

    items.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
            <button class="product-card--button open-product" data-product-id="${product.id}">
                <img src="${product.urlImg}" alt="${product.name}">
                <div class="product-info">
                    <span class="category-tag">${product.category.name}</span>
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price">${product.price}</p>
                    <span class="status ${product.availableProduct ? "available" : "unavailable"}">
                        ${product.availableProduct ? "Disponible" : "No disponible"}
                    </span>
                </div>
            </button>
        `;

        const openButton = productCard.querySelector(".open-product") as HTMLButtonElement;
        openButton?.addEventListener("click", () => {
            navigate(`${PRODUCTS_DETAIL_ROUTE}?id=${product.id}`);
        });

        productGrid.appendChild(productCard);
    });
};

/* Aplicar filtros: búsqueda, disponibilidad y orden */
function applyAllFilters() {
    const searchQuery = (document.getElementById("searchBar") as HTMLInputElement)
        .value.toLowerCase();
    const sortOrder = (document.querySelector("select:nth-of-type(1)") as HTMLSelectElement)
        .value;
    const availabilityFilter = (document.querySelector("select:nth-of-type(2)") as HTMLSelectElement)
        .value;

    let filtered = [...products];

    // Filtrar por texto de búsqueda
    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    }
    // Filtrar por disponibilidad
    if (availabilityFilter === "activos") {
        filtered = filtered.filter(p => p.availableProduct);
    } else if (availabilityFilter === "inactivos") {
        filtered = filtered.filter(p => !p.availableProduct);
    }
    // Ordenar por precio
    if (sortOrder === "menor-mayor") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "mayor-menor") {
        filtered.sort((a, b) => b.price - a.price);
    }

    filteredProducts = filtered;
    renderProducts(filteredProducts);
}

/* Cargar productos desde el backend */
async function loadProducts(endpoint: string = `${API_BASE}/product/user`) {
    try {
        products = await apiFetch<IProduct[]>(endpoint, { method: "GET" });
        filteredProducts = products;
        applyAllFilters();
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

// Setup del buscador
const searchBar = document.getElementById("searchBar") as HTMLInputElement;
searchBar.addEventListener("input", applyAllFilters);

// Filtros y orden
const sortSelect = document.querySelectorAll("select")[0] as HTMLSelectElement;
const filterSelect = document.querySelectorAll("select")[1] as HTMLSelectElement;

sortSelect.addEventListener("change", applyAllFilters);
filterSelect.addEventListener("change", () => {
    const selectedFilter = filterSelect.value;
    if (selectedFilter === "activos") {
        loadProducts(`${API_BASE}/product/user`);
    } else if (selectedFilter === "inactivos") {
        loadProducts(`${API_BASE}/product/admin`);
    } else {
        loadProducts(`${API_BASE}/product/admin`);
    }
});

/* Cargar y mostrar categorías (lista lateral) */
async function setupCategories() {
    try {
        const categories = await apiFetch<ICategory[]>(`${API_BASE}/category`, { method: "GET" });
        const categoriesList = document.querySelector(".categories-list") as HTMLUListElement;

            // Filtrar productos por categoría
        const filterByCategory = (categoryId: number) => {
            if (categoryId === 0) {
                renderProducts(products);
                return;
            }
            const filtered = products.filter(p => p.category.id === categoryId);
            renderProducts(filtered);
        };

        // Agregar categorías al DOM
        categories.forEach(category => {
            const li = document.createElement("li");
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = category.name;

            link.addEventListener("click", e => {
                e.preventDefault();
                setActive(link);
                filterByCategory(category.id);
            });

            li.appendChild(link);
            categoriesList.appendChild(li);
        });

        // Botón "Todos los productos"
        const allProducts = document.getElementById("all-products") as HTMLAnchorElement;
        allProducts.addEventListener("click", e => {
            e.preventDefault();
            setActive(allProducts);
            filterByCategory(0);
        });
    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

//----- INICIAR -----
loadProducts();
setupCategories();
