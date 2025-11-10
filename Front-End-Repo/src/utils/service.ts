

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
