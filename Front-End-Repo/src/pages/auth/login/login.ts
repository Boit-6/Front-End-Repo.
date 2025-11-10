import type { IUser } from "../../../types/IUser";
import { saveUser } from "../../../utils/auth";
import { navigate, ADMIN_ROUTE, USER_ROUTE } from "../../../utils/navigate";

const loginForm = document.getElementById("form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

const storeUserRaw = localStorage.getItem("userData");


if (storeUserRaw) {
    try {
        const storeUser = JSON.parse(storeUserRaw) as Partial<IUser>;
        if (storeUser.role === "ADMIN") {
            navigate(ADMIN_ROUTE);
        }
    }   catch (err) {
        navigate(USER_ROUTE);
}
}

loginForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();

    const emailIn: string = emailInput.value.trim();
    const passwordIn: string = passwordInput.value.trim();

    try {
    const response = await fetch("http://localhost:8080/user/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email: emailIn,
        password: passwordIn,
        }),
    });

    if (!response.ok) {
        alert("Email o contraseña incorrectos");
        return;
    }

    const user: IUser = await response.json();

    const userData: IUser = {
        id: user.id,
        email: user.email,
        password: "",
        role: user.role,
        name: user.name,
        last_Name: user.last_Name,
    };

    saveUser(userData);

    if (userData.role == "ADMIN") {
        navigate(ADMIN_ROUTE);
    } else if (userData.role == "USER") {
        navigate(USER_ROUTE);
    }else {
        alert("Usuario no autorizado");
    }

    } catch (err) {
    alert("Error de conexión con el servidor ");
    }
});
