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
    }
};

export default flowService;
