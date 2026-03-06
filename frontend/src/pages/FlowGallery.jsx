import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers'
import Sidebar from '../components/dashboard/Sidebar'
import flowService from '../services/flow.service'
import '../styles/auth.css'

const FlowGallery = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [flows, setFlows] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('newest')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [cloning, setCloning] = useState(null)

    const fetchFlows = useCallback(async () => {
        setLoading(true)
        try {
            const data = await flowService.getPublicFlows({ page, search, sort, limit: 12 })
            setFlows(data.flows || [])
            setTotalPages(data.totalPages || 1)
            setTotal(data.total || 0)
        } catch (err) {
            console.error('Failed to fetch public flows:', err)
        } finally {
            setLoading(false)
        }
    }, [page, search, sort])

    useEffect(() => { fetchFlows() }, [fetchFlows])

    const handleSearch = (e) => {
        e.preventDefault()
        setPage(1)
        fetchFlows()
    }

    const handleClone = async (flowId) => {
        if (!user) return navigate('/login')
        setCloning(flowId)
        try {
            const newFlow = await flowService.cloneFlow(flowId)
            navigate(`/flow/${newFlow._id}`)
        } catch (err) {
            console.error('Clone failed:', err)
            setCloning(null)
        }
    }

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="content-header">
                    <h1>🌍 Explore Flows</h1>
                    <span className="gallery-total">{total} public flows</span>
                </header>

                <div className="content-body">
                    {/* Search & Sort Bar */}
                    <div className="gallery-controls">
                        <form className="gallery-search-form" onSubmit={handleSearch}>
                            <input
                                type="text"
                                className="gallery-search-input"
                                placeholder="Search flows..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="gallery-search-btn">🔍</button>
                        </form>
                        <div className="gallery-sort">
                            {['newest', 'popular', 'oldest'].map(s => (
                                <button
                                    key={s}
                                    className={`gallery-sort-btn ${sort === s ? 'active' : ''}`}
                                    onClick={() => { setSort(s); setPage(1) }}
                                >
                                    {s === 'newest' ? '🕐 Newest' : s === 'popular' ? '🔥 Popular' : '📅 Oldest'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    {loading ? (
                        <div className="gallery-loading">
                            <div className="gallery-spinner">🌊</div>
                            <p>Loading flows...</p>
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="gallery-empty">
                            <span className="gallery-empty-icon">🏜️</span>
                            <h3>No public flows yet</h3>
                            <p>Share your flows to see them here!</p>
                        </div>
                    ) : (
                        <div className="gallery-grid">
                            {flows.map(flow => (
                                <div key={flow._id} className="gallery-card">
                                    <div className="gallery-card-header">
                                        <h3 className="gallery-card-title">{flow.title}</h3>
                                        {flow.tags?.length > 0 && (
                                            <div className="gallery-card-tags">
                                                {flow.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="gallery-tag">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {flow.description && (
                                        <p className="gallery-card-desc">{flow.description}</p>
                                    )}
                                    <div className="gallery-card-meta">
                                        <div className="gallery-card-author">
                                            <div className="gallery-avatar">
                                                {flow.userId?.avatar ? (
                                                    <img src={flow.userId.avatar} alt="" />
                                                ) : (
                                                    <span>{flow.userId?.fullName?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div className="gallery-author-info">
                                                <span className="gallery-author-name">{flow.userId?.fullName || 'Unknown'}</span>
                                                <span className="gallery-author-level">Lv.{flow.userId?.level || 1}</span>
                                            </div>
                                        </div>
                                        <div className="gallery-card-stats">
                                            <span title="Nodes">🧩 {flow.nodeCount || 0}</span>
                                            <span title="Clones">📋 {flow.cloneCount || 0}</span>
                                            <span title="Created">{formatDate(flow.createdAt)}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="gallery-clone-btn"
                                        onClick={() => handleClone(flow._id)}
                                        disabled={cloning === flow._id}
                                    >
                                        {cloning === flow._id ? '⏳ Cloning...' : '📥 Clone to My Flows'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="gallery-pagination">
                            <button
                                className="gallery-page-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >← Prev</button>
                            <span className="gallery-page-info">Page {page} of {totalPages}</span>
                            <button
                                className="gallery-page-btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >Next →</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default FlowGallery
