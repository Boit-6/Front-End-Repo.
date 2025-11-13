import { showToast } from './toast';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchConfig {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
}


export async function apiFetch<T = any>(
    url: string,
    config: FetchConfig = {},
    options?: {
        successMessage?: string;
        errorMessage?: string;
        showError?: boolean;
    }
): Promise<T> {
    const {
        method = 'GET',
        body,
        headers = { 'Content-Type': 'application/json' }
    } = config;

    const {
        successMessage,
        errorMessage = 'Error en la solicitud',
        showError = true
    } = options || {};

    try {
        const response = await fetch(url, {
            method,
            headers,
            ...(body && { body: typeof body === 'string' ? body : JSON.stringify(body) })
        });

        if (!response.ok) {
            const message = errorMessage || `Error ${response.status}`;
            if (showError) showToast(message, 'error');
            throw new Error(message);
        }

        const data = await response.json();
        
        if (successMessage) {
            showToast(successMessage, 'success');
        }

        return data as T;
    } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        if (showError && !successMessage) {
            showToast(message, 'error');
        }
        throw error;
    }
}


export async function apiDeleteWithConfirm(
    url: string,
    confirmMessage: string,
    successMessage?: string
): Promise<void> {
    const { showConfirm } = await import('./confirm');
    const ok = await showConfirm(confirmMessage);
    if (!ok) return;

    await apiFetch(url, { method: 'DELETE' }, { successMessage });
}
