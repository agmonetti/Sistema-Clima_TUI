const API_URL = 'http://localhost:3000/api';

const api = {
    // Método GET Genérico
    async get(endpoint) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    // Método DELETE Genérico
    async delete(endpoint) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falló la petición');
        return await response.json();
    },
    
    // Método POST Genérico (Login, etc)
    async post(endpoint, body) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        return await response.json();
    }
};  