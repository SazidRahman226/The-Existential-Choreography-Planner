import React from 'react'

const ShareFlowModal = ({ flow, onClose, onConfirm }) => {
    if (!flow) return null

    const status = flow.publicStatus || 'private'

    const renderContent = () => {
        switch (status) {
            case 'approved':
                return (
                    <>
                        <p className="share-modal-desc">
                            This flow is currently <strong>🌍 Public</strong> and visible to everyone in the Explore gallery.
                        </p>
                        <div className="share-modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn-danger" onClick={onConfirm}>Unpublish Flow</button>
                        </div>
                    </>
                )
            case 'pending':
                return (
                    <>
                        <p className="share-modal-desc">
                            Your flow is currently <strong>⏳ Pending</strong> admin review. it will be visible in the Explore gallery once approved.
                        </p>
                        <div className="share-modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Close</button>
                            <button className="btn-danger" onClick={onConfirm}>Withdraw Request</button>
                        </div>
                    </>
                )
            case 'rejected':
                return (
                    <>
                        <div className="share-modal-rejection">
                            <strong>Admin Note:</strong>
                            <p>{flow.reviewNote || 'No specific reason provided.'}</p>
                        </div>
                        <p className="share-modal-desc">
                            You can make changes to your flow and re-submit it for review.
                        </p>
                        <div className="share-modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={onConfirm}>Revise & Re-submit</button>
                        </div>
                    </>
                )
            case 'private':
            default:
                return (
                    <>
                        <p className="share-modal-desc">
                            Sharing your flow will allow others to discover and clone it from the Explore gallery.
                        </p>
                        <div className="share-modal-warning">
                            <strong>Note:</strong> All submissions require admin review before becoming public.
                        </div>
                        <div className="share-modal-actions">
                            <button className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={onConfirm}>Submit for Review</button>
                        </div>
                    </>
                )
        }
    }

    const titles = {
        private: 'Share Flow to Gallery',
        pending: 'Flow Under Review',
        approved: 'Manage Public Flow',
        rejected: 'Flow Submission Rejected'
    }

    return (
        <div className="modal-overlay">
            <div className="share-modal-content">
                <div className="share-modal-header">
                    <h2>{titles[status]}</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                {renderContent()}
            </div>
        </div>
    )
}

export default ShareFlowModal
