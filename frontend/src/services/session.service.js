import api from './api'

const sessionService = {
    getAll: async () => {
        const res = await api.get('/sessions')
        return res.data
    },

    create: async (data) => {
        const res = await api.post('/sessions', data)
        return res.data
    },

    update: async (id, data) => {
        const res = await api.put(`/sessions/${id}`, data)
        return res.data
    },

    delete: async (id) => {
        const res = await api.delete(`/sessions/${id}`)
        return res.data
    }
}

export default sessionService
