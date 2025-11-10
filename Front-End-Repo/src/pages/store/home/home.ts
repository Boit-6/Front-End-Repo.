//----- IMPORTS -----
import type { IProduct } from "../../../types/IProducts";
import type { ICategory } from "../../../types/ICategories";
import { logoutUser, checkAuthUser } from "../../../utils/auth";
import { LOGIN_ROUTE, PRODUCTS_DETAIL_ROUTE, navigate } from "../../../utils/navigate";
import { showUserName } from "../../../utils/service";


//----- MOSTRAR NOMBRE DEL USUARIO -----
showUserName();

//----- VERIFICAR USUARIO -----
checkAuthUser("USER", LOGIN_ROUTE);


//----- FUNCIÓN GLOBAL: ACTIVAR UNA CATEGORÍA (CLASE EN <li>) -----
const setActive = (linkElement: HTMLElement) => {
    // Quitar la clase active de todos los <li>
    document.querySelectorAll(".categories-list li").forEach((li) => {
        li.classList.remove("active");
    });

    // Buscar el <li> asociado al <a>
    const parentLi = linkElement.closest("li");
    if (parentLi) {
        parentLi.classList.add("active");
    }
};


//----- FUNCIÓN GLOBAL: RENDERIZAR PRODUCTOS -----
const renderProducts = (items: IProduct[]) => {
    const productGrid = document.querySelector(".product-grid") as HTMLDivElement;
    productGrid.innerHTML = "";

    items.forEach((product) => {
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


//----- LOGOUT -----
const logout = document.getElementById("logout") as HTMLButtonElement;
logout.addEventListener("click", () => logoutUser());


//----- VARIABLE GLOBAL PARA GUARDAR PRODUCTOS -----
let products: IProduct[] = [];


//==============================
//     OBTENER PRODUCTOS
//==============================
try {
    const response = await fetch("http://localhost:8080/product/admin", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error("Error al obtener los productos");

    products = await response.json();

    // Render inicial
    renderProducts(products);

    //----- BUSCADOR -----
    const searchBar = document.getElementById("searchBar") as HTMLInputElement;

    searchBar.addEventListener("input", () => {
        const query = searchBar.value.toLowerCase();

        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(query)
        );

        renderProducts(filtered);
    });

} catch (error) {
    console.error("Error al conectar con el servidor:", error);
}



//==============================
//     OBTENER CATEGORÍAS
//==============================
try {
    const response = await fetch("http://localhost:8080/category", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error("Error al obtener las categorías");

    const categories: ICategory[] = await response.json();
    const categoriesList = document.querySelector(".categories-list") as HTMLUListElement;


    //----- FUNCIÓN FILTRAR POR CATEGORÍA -----
    const filterByCategory = (categoryId: number) => {
        if (categoryId === 0) {
            renderProducts(products);
            return;
        }

        const filtered = products.filter(
            (product) => product.category.id === categoryId
        );

        renderProducts(filtered);
    };


    //----- AGREGAR LISTA DE CATEGORÍAS -----
    categories.forEach((category) => {
        const li = document.createElement("li");
        const link = document.createElement("a");

        link.href = "#";
        link.textContent = category.name;

        link.addEventListener("click", (e) => {
            e.preventDefault();
            setActive(link);
            filterByCategory(category.id);
        });

        li.appendChild(link);
        categoriesList.appendChild(li);
    });


    //----- BOTÓN "TODOS LOS PRODUCTOS" -----
    const allProducts = document.getElementById("all-products") as HTMLAnchorElement;

    allProducts.addEventListener("click", (e) => {
        e.preventDefault();
        setActive(allProducts);  // ahora activa el <li> correcto
        filterByCategory(0);
    });

} catch (error) {
    console.error("Error al conectar con el servidor:", error);
}
