/**
 * Table and Card rendering utilities
 */

export interface TableColumn<T> {
    header: string;
    key?: keyof T;
    render?: (item: T, index: number) => string | HTMLElement;
    className?: string;
}

/**
 * Create a table row from an object using column definitions
 */
export function createTableRow<T>(item: T, columns: TableColumn<T>[]): HTMLTableRowElement {
    const tr = document.createElement('tr');

    columns.forEach(col => {
        const td = document.createElement('td');
        
        if (col.className) {
            td.className = col.className;
        }

        if (col.render) {
            const content = col.render(item, 0);
            if (typeof content === 'string') {
                td.innerHTML = content;
            } else {
                td.appendChild(content);
            }
        } else if (col.key) {
            const value = item[col.key];
            td.innerText = String(value ?? '');
        }

        tr.appendChild(td);
    });

    return tr;
}

/**
 * Create a table from an array of items
 */
export function createTable<T>(
    items: T[],
    columns: TableColumn<T>[],
    className: string = 'table'
): HTMLTableElement {
    const table = document.createElement('table');
    table.className = className;

    // Create thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col.header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody
    const tbody = document.createElement('tbody');
    items.forEach(item => {
        const row = createTableRow(item, columns);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    return table;
}

/**
 * Clear container and insert element
 */
export function setContainerContent(
    containerId: string,
    element: HTMLElement
): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(element);
}

/**
 * Batch append elements to container
 */
export function appendToContainer(
    containerId: string,
    elements: HTMLElement | HTMLElement[]
): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const items = Array.isArray(elements) ? elements : [elements];
    items.forEach(el => container.appendChild(el));
}
