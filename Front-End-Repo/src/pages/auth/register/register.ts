import type { IUser } from "../../../types/IUser";
import { navigate, LOGIN_ROUTE } from "../../../utils/navigate";
import { showToast } from "../../../utils/toast";
import { apiFetch } from "../../../utils/api";

/*
    Pantalla de registro
    - Envía datos al backend y redirige al login si todo OK
*/

const API_BASE = "http://localhost:8080";

const registerForm = document.getElementById("registerForm") as HTMLFormElement;
const nombreInput = document.getElementById("Nombre") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

// Envío del formulario de registro
registerForm.addEventListener("submit", async e => {
    e.preventDefault();

    const newUser: Partial<IUser> = {
        name: nombreInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
    };

    try {
        await apiFetch(
            `${API_BASE}/user/register`,
            { method: "POST", body: newUser },
            { successMessage: "Usuario registrado exitosamente" }
        );
        registerForm.reset();
        navigate(LOGIN_ROUTE);
    } catch (err) {
        console.error("Error en registro:", err);
        showToast("Error al registrar el usuario", "error");
    }
});