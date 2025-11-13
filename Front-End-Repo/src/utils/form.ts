export interface FormFieldConfig {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
}

export function getFormValues(form: HTMLFormElement): Record<string, any> {
    const formData = new FormData(form);
    const values: Record<string, any> = {};

    formData.forEach((value, key) => {
        values[key] = value;
    });

    return values;
}

export function fillForm(
    form: HTMLFormElement,
    data: Record<string, any>
): void {
    Object.entries(data).forEach(([key, value]) => {
        const field = form.querySelector(`[name="${key}"]`) as HTMLInputElement | null;
        if (field) {
            field.value = String(value ?? '');
        }
    });
}

export function resetFormFields(form: HTMLFormElement, fieldNames?: string[]): void {
    if (!fieldNames) {
        form.reset();
        return;
    }

    fieldNames.forEach(name => {
        const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
        if (field) field.value = '';
    });
}

export function validateRequired(
    form: HTMLFormElement,
    requiredFields: string[]
): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    requiredFields.forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | null;
        if (!field || !field.value.trim()) {
            missing.push(fieldName);
        }
    });

    return { valid: missing.length === 0, missing };
}
