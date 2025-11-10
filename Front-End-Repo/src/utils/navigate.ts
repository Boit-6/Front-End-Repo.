const navigate = (url: string) => {
    window.location.href = url;
}
const ADMIN_ROUTE = "/src/pages/store/admin/adminHome/adminHome.html";
const USER_ROUTE = "/src/pages/store/home/home.html";
const LOGIN_ROUTE = "/src/pages/auth/login/login.html";
const REGISTER_ROUTE = "/src/pages/auth/register/register.html";
const CATEGORIES_ROUTE = "/src/pages/store/admin/categories/categories.html";
const PRODUCTS_ROUTE = "/src/pages/store/admin/products/products.html";
const ORDERS_ROUTE = "/src/pages/store/admin/orders/orders.html";
const PRODUCTS_DETAIL_ROUTE = "/src/pages/store/home/productDetail/productDetail.html";

export { navigate, ADMIN_ROUTE, USER_ROUTE, LOGIN_ROUTE, REGISTER_ROUTE, CATEGORIES_ROUTE, PRODUCTS_ROUTE, ORDERS_ROUTE, PRODUCTS_DETAIL_ROUTE };
