export function showConfirm(message: string, title = 'Confirmar'): Promise<boolean> {
    return new Promise((resolve) => {
        // Crear elementos
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,0.4)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        const box = document.createElement('div');
        box.className = 'confirm-box';
        box.style.background = '#fff';
        box.style.padding = '1rem';
        box.style.borderRadius = '8px';
        box.style.width = '320px';
        box.style.maxWidth = '90%';
        box.style.boxShadow = '0 4px 18px rgba(0,0,0,0.2)';

        const h = document.createElement('h3');
        h.style.margin = '0 0 0.5rem 0';
        h.textContent = title;

        const p = document.createElement('p');
        p.style.margin = '0 0 1rem 0';
        p.textContent = message;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '0.5rem';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.padding = '0.5rem 0.75rem';
        cancelBtn.style.border = 'none';
        cancelBtn.style.background = '#e0e0e0';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.style.cursor = 'pointer';

        const okBtn = document.createElement('button');
        okBtn.textContent = 'Confirmar';
        okBtn.style.padding = '0.5rem 0.75rem';
        okBtn.style.border = 'none';
        okBtn.style.background = 'var(--primary, #1976d2)';
        okBtn.style.color = '#fff';
        okBtn.style.borderRadius = '6px';
        okBtn.style.cursor = 'pointer';

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

        // focus first actionable
        okBtn.focus();
    });
}
