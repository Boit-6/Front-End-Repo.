import { USER_ROUTE, ADMIN_ROUTE } from "./navigate";

export const showUserName = () => {
try {
    const raw = localStorage.getItem("userData");
    if (raw) {
        const user = JSON.parse(raw) as { name?: string; last_Name?: string; email?: string };
        const displayName = [user.name, user.last_Name].filter(Boolean).join(" ") || (user.email || "");
        const userNameEl = document.getElementById("userName");
        if (userNameEl) userNameEl.textContent = displayName;
    }
} catch {}
}

export const adjustHeaderLinks = () => {
    try {
        const raw = localStorage.getItem('userData');
        const parsed = raw ? JSON.parse(raw) : null;
        const anchors = Array.from(document.querySelectorAll('.app-nav a')) as HTMLAnchorElement[];

        const findByFragment = (fragments: string[]) =>
            anchors.find(a => {
                const txt = (a.textContent || '').toLowerCase();
                return fragments.some(f => txt.includes(f));
            });

        const inicio = findByFragment(['inicio', 'tienda', 'tienda']);
        if (inicio) inicio.href = USER_ROUTE;

        const misPedidos = findByFragment(['mis pedidos', 'mis pedidos', 'pedidos']);
        if (misPedidos) {
            misPedidos.style.display = '';
            misPedidos.href = '/src/pages/store/home/myOrders/myOrders.html';
        }

        const adminLink = findByFragment(['administraci', 'panel admin', 'panel']);
        if (adminLink) {
            if (!parsed || parsed.role !== 'ADMIN') {
                adminLink.style.display = 'none';
            } else {
                adminLink.href = ADMIN_ROUTE;
            }
        }

        const cart = findByFragment(['carrito', '🛒']);
        if (cart) cart.href = '/src/pages/store/home/cart/cart.html';
    } catch {}
};
