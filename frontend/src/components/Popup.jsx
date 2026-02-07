import React, { useEffect } from 'react';
import '../styles/auth.css'; // Reusing auth styles for consistency, or we can make new ones

const Popup = ({ isOpen, onClose, title, message, type = 'info', actions }) => {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Determine icon and color based on type
    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return { color: '#4caf50', icon: '✓' };
            case 'error':
                return { color: '#f44336', icon: '✕' };
            case 'warning':
                return { color: '#ff9800', icon: '!' };
            default:
                return { color: '#2196f3', icon: 'i' };
        }
    };

    const { color, icon } = getTypeStyles();

    return (
        <div className="popup-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="popup-content" onClick={e => e.stopPropagation()} style={{
                backgroundColor: 'var(--card-bg, #ffffff)',
                padding: '2rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: `${color}20`, // 20% opacity
                    color: color,
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    fontWeight: 'bold'
                }}>
                    {icon}
                </div>

                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ margin: '0 0 2rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{message}</p>

                <div className="popup-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {actions ? actions : (
                        <button
                            className="btn-primary"
                            onClick={onClose}
                            style={{ minWidth: '120px' }}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Popup;
