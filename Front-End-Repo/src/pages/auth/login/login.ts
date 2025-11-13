import type { IUser } from "../../../types/IUser";
import { saveUser } from "../../../utils/auth";
import { navigate, ADMIN_ROUTE, USER_ROUTE } from "../../../utils/navigate";
import { showToast } from "../../../utils/toast";
import { apiFetch } from "../../../utils/api";

/*
  Pantalla de login
  - Envía credenciales al backend
  - Guarda usuario en localStorage y redirige según rol
*/

const API_BASE = "http://localhost:8080";

const loginForm = document.getElementById("form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

// Si ya hay sesión activa, redirigir según rol
const storeUserRaw = localStorage.getItem("userData");
if (storeUserRaw) {
    try {
        const storeUser = JSON.parse(storeUserRaw) as Partial<IUser>;
        if (storeUser.role === "ADMIN") navigate(ADMIN_ROUTE);
        else navigate(USER_ROUTE);
    } catch (err) {
        console.error("Error al verificar usuario:", err);
    }
}

// Manejo del submit de login
loginForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const user = await apiFetch<IUser>(
            `${API_BASE}/user/login`,
            {
                method: "POST",
                body: { email, password }
            },
            { errorMessage: "Email o contraseña incorrectos" }
        );

        const userData: IUser = {
            id: user.id,
            email: user.email,
            password: "",
            role: user.role,
            name: user.name,
            last_Name: user.last_Name
        };

        saveUser(userData);

        if (userData.role === "ADMIN") {
            navigate(ADMIN_ROUTE);
        } else if (userData.role === "USER") {
            navigate(USER_ROUTE);
        } else {
            showToast("Usuario no autorizado", "error");
        }
    } catch (err) {
        console.error("Error en login:", err);
        showToast("Error de conexión con el servidor", "error");
    }
});
