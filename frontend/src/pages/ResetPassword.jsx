import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { usePopup } from '../providers'
import '../styles/auth.css'

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const { showPopup, closePopup } = usePopup()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            showPopup({
                title: 'Match Error',
                message: 'Passwords do not match',
                type: 'error'
            })
            return
        }

        if (password.length < 6) {
            showPopup({
                title: 'Password Too Short',
                message: 'Password must be at least 6 characters',
                type: 'error'
            })
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`http://localhost:3000/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            })

            const data = await response.json()

            if (response.ok) {
                showPopup({
                    title: 'Password Reset Successful',
                    message: 'Your password has been reset. Please login with your new password.',
                    type: 'success',
                    actions: (
                        <button
                            className="btn-primary"
                            onClick={closePopup}
                            style={{ minWidth: '120px' }}
                        >
                            Go to Login
                        </button>
                    ),
                    onClose: () => navigate('/login')
                })
            } else {
                showPopup({
                    title: 'Error',
                    message: data.message || 'Something went wrong',
                    type: 'error'
                })
            }
        } catch (err) {
            showPopup({
                title: 'Connection Error',
                message: 'Failed to connect to the server',
                type: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1>Reset Password</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <p className="auth-link">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    )
}

export default ResetPassword
