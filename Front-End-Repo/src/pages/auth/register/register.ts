import type { IUser } from "../../../types/IUser";
import { navigate , LOGIN_ROUTE } from "../../../utils/navigate";

const registerForm = document.getElementById("registerForm") as HTMLFormElement;

const NombreInput = document.getElementById("Nombre") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newUser: IUser = {
        name: NombreInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
    };

    try {
        const response = await fetch("http://localhost:8080/user/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
    });
        if (!response.ok) {
            alert("Error al registrar el usuario");
            return;
        }
        let data: unknown = null
        try{
            data = await response.json();
        }catch(err){
            alert("Error al registrar el usuario");
            return;
        }
        alert("Usuario registrado exitosamente" + data);
        if (response.ok) {
            navigate(LOGIN_ROUTE);
        }
        registerForm.reset();
    } catch (err) {
        alert("Error en el servidor");
}
});