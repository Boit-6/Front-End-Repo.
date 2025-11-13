export type ToastType = 'info' | 'success' | 'warning' | 'error';

const containerId = 'app_toast_container';

function ensureContainer() {
    let el = document.getElementById(containerId) as HTMLDivElement | null;
    if (!el) {
        el = document.createElement('div');
        el.id = containerId;
        el.className = 'toast-container';
        document.body.appendChild(el);
    }
    return el;
}

export function showToast(message: string, type: ToastType = 'info', duration = 3500) {
    const container = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;

    const btn = document.createElement('button');
    btn.className = 'close-toast';
    btn.innerText = '×';
    btn.onclick = () => {
        toast.remove();
    };

    toast.appendChild(btn);
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}
