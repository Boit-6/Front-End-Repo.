export function showConfirm(message: string, title = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        const box = document.createElement('div');
        box.className = 'confirm-box';

        const h = document.createElement('h3');
        h.textContent = title;

        const p = document.createElement('p');
        p.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'confirm-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar';

        const okBtn = document.createElement('button');
        okBtn.className = 'ok-btn';
        okBtn.textContent = 'Confirmar';

        // Armar estructura
        actions.appendChild(cancelBtn);
        actions.appendChild(okBtn);

        box.appendChild(h);
        box.appendChild(p);
        box.appendChild(actions);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const cleanup = (val: boolean) => {
            overlay.remove();
            resolve(val);
        };

        cancelBtn.addEventListener('click', () => cleanup(false));
        okBtn.addEventListener('click', () => cleanup(true));

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });

        okBtn.focus();
    });
}
