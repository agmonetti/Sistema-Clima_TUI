const API_URL = 'http://localhost:3000/api';

const api = {
    async get(endpoint) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: headers
        });
        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error(`Error crítico de red o servidor caído (${response.status})`);
        }
        if (!response.ok) {
            throw new Error(data.error || data.message || `Error ${response.status}`);
        }

        return data;
    },

    async delete(endpoint) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: headers
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
        
             if(response.ok) return true; 
             throw new Error(`Error de servidor (${response.status})`);
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error al eliminar');
        }

        return data;
    },

    async post(endpoint, body) {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Error en la petición');
        }

        return data;
    }
};