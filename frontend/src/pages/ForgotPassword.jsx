import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePopup } from '../providers'
import '../styles/auth.css'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const { showPopup } = usePopup()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                showPopup({
                    title: 'Email Sent',
                    message: 'Check your email for the password reset link.',
                    type: 'success'
                })
                setEmail('')
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
                <h1>Forgot Password</h1>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <p className="auth-link">
                    Remember your password? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default ForgotPassword
