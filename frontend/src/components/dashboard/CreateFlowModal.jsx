import { useState } from 'react'
import flowService from '../../services/flow.service'

const CreateFlowModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        isPublic: false
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await flowService.create(formData)
            onSuccess()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to create flow')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Create New Flow</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Morning Routine"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="What is this flow for?"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleChange}
                            />
                            Make Public
                        </label>
                        <p className="help-text" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                            Public flows can be viewed and cloned by other community members.
                        </p>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-card" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Flow'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateFlowModal
