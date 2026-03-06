import api from './api';

const flowService = {
    getAll: async () => {
        const response = await api.get('/flows');
        return response.data;
    },
    create: async (flowData) => {
        const response = await api.post('/flows', flowData);
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/flows/${id}`);
        return response.data;
    },
    update: async (id, flowData) => {
        const response = await api.put(`/flows/${id}`, flowData);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/flows/${id}`);
        return response.data;
    },
    completeFlow: async (id, data) => {
        const response = await api.patch(`/flows/${id}/complete-flow`, data);
        return response.data;
    },
    // --- Public Gallery ---
    getPublicFlows: async (params = {}) => {
        const response = await api.get('/flows/public', { params });
        return response.data;
    },
    cloneFlow: async (id) => {
        const response = await api.post(`/flows/${id}/clone`);
        return response.data;
    },
    togglePublic: async (id, tags) => {
        const response = await api.patch(`/flows/${id}/toggle-public`, { tags });
        return response.data;
    },
    // --- Admin Review ---
    getPendingFlows: async () => {
        const response = await api.get('/flows/pending');
        return response.data;
    },
    reviewFlow: async (id, action, note = '') => {
        const response = await api.patch(`/flows/${id}/review`, { action, note });
        return response.data;
    }
};

export default flowService;
