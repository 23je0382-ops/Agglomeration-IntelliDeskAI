const API_BASE = 'https://agglomeration-intellideskai.onrender.com/api';

// Generic fetch wrapper with error handling
// Generic fetch wrapper with error handling
export async function fetchAPI(endpoint, options = {}) {
    // Ensure no double slashes if API_BASE ends with / and endpoint starts with /
    const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${path}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
}

// Tickets API
export const ticketsAPI = {
    getAll: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('ticket_type', filters.type);
        if (filters.priority) params.append('priority', filters.priority);
        const query = params.toString();
        return fetchAPI(`/tickets${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchAPI(`/tickets/${id}`),

    create: (ticket) => fetchAPI('/tickets/', {
        method: 'POST',
        body: JSON.stringify(ticket),
    }),

    update: (id, data) => fetchAPI(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    approve: (id, response) => fetchAPI(`/tickets/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ final_response: response }),
    }),

    regenerate: (id) => fetchAPI(`/tickets/${id}/regenerate`, {
        method: 'POST',
    }),

    delete: (id) => fetchAPI(`/tickets/${id}`, {
        method: 'DELETE',
    }),
};

// Knowledge Base API
export const knowledgeAPI = {
    getAll: () => fetchAPI('/knowledge'),

    getById: (id) => fetchAPI(`/knowledge/${id}`),

    getContent: (id) => fetchAPI(`/knowledge/${id}/content`),

    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchAPI('/knowledge/upload', {
            method: 'POST',
            body: formData,
        });
    },

    search: (query) => fetchAPI('/knowledge/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
    }),

    delete: (id) => fetchAPI(`/knowledge/${id}`, {
        method: 'DELETE',
    }),

    getStats: () => fetchAPI('/knowledge/stats/index'),
};

// Analytics API
export const analyticsAPI = {
    get: () => fetchAPI('/analytics/'),

    getDaily: (days = 7) => fetchAPI(`/analytics/daily?days=${days}`),
};

// Customers API
export const customersAPI = {
    getCustomers: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/customers${query ? `?${query}` : ''}`);
    },

    getAccounts: () => fetchAPI('/accounts'),
    getAccountDetails: (id) => fetchAPI(`/accounts/${id}`),
};

// Health check
export const healthCheck = () => fetchAPI('/health');

