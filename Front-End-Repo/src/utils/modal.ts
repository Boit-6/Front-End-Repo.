/**
 * Utility to manage modal overlays and their lifecycle
 */

export interface ModalConfig {
    modalSelector: string;
    closeSelector: string;
}

export function openModal(modalElement: HTMLElement): void {
    modalElement.classList.remove('hidden');
}

export function closeModal(modalElement: HTMLElement, formElement?: HTMLFormElement): void {
    modalElement.classList.add('hidden');
    if (formElement) formElement.reset();
}

export function setupModalClosers(config: ModalConfig): void {
    const modal = document.querySelector(config.modalSelector) as HTMLElement | null;
    const closeBtn = document.querySelector(config.closeSelector) as HTMLElement | null;

    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });

    // Close on overlay click (click outside modal)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

export function setupModalForm(
    config: ModalConfig,
    onSubmit: (formData: FormData) => Promise<void>
): void {
    const modal = document.querySelector(config.modalSelector) as HTMLElement | null;
    const form = modal?.querySelector('form') as HTMLFormElement | null;

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await onSubmit(new FormData(form));
        } catch (err) {
            console.error('Form submission error:', err);
        }
    });
}
