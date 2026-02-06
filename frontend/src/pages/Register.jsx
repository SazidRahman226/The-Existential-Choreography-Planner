import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers'
import '../styles/auth.css'

const Register = () => {
    const navigate = useNavigate()
    const { register, error } = useAuth()
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Username availability state
    const [usernameStatus, setUsernameStatus] = useState({
        checking: false,
        available: null,
        message: ''
    })

    // Debounce username check
    const checkUsernameAvailability = useCallback(async (username) => {
        if (!username || username.length < 3) {
            setUsernameStatus({
                checking: false,
                available: null,
                message: username.length > 0 ? 'Username must be at least 3 characters' : ''
            })
            return
        }

        setUsernameStatus({ checking: true, available: null, message: 'Checking...' })

        try {
            const response = await fetch(`http://localhost:3000/api/auth/check-username/${username}`)
            const data = await response.json()

            setUsernameStatus({
                checking: false,
                available: data.available,
                message: data.message
            })
        } catch (err) {
            setUsernameStatus({
                checking: false,
                available: null,
                message: 'Error checking username'
            })
        }
    }, [])

    // Debounce effect for username check
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formData.username) {
                checkUsernameAvailability(formData.username)
            }
        }, 500) // Wait 500ms after user stops typing

        return () => clearTimeout(timeoutId)
    }, [formData.username, checkUsernameAvailability])

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setFormError('')

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match')
            return
        }

        // Validate password length
        if (formData.password.length < 6) {
            setFormError('Password must be at least 6 characters')
            return
        }

        // Check if username is available
        if (usernameStatus.available === false) {
            setFormError('Please choose a different username')
            return
        }

        setLoading(true)

        const result = await register(
            formData.fullName,
            formData.username,
            formData.email,
            formData.password
        )

        setLoading(false)

        if (result.success) {
            navigate('/dashboard')
        } else {
            setFormError(result.error)
        }
    }

    const getInputClassName = () => {
        if (usernameStatus.checking) return ''
        if (usernameStatus.available === true) return 'input-success'
        if (usernameStatus.available === false) return 'input-error'
        return ''
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h1>Register</h1>
                {(formError || error) && (
                    <div className="error-message">{formError || error}</div>
                )}
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <input
                            type="text"
                            id="fullName"
                            placeholder="Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div className="username-wrapper">
                            <input
                                type="text"
                                id="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                className={getInputClassName()}
                                required
                            />
                            {formData.username && (
                                <div className={`username-status ${usernameStatus.checking ? 'checking' :
                                    usernameStatus.available === true ? 'available' :
                                        usernameStatus.available === false ? 'unavailable' : ''
                                    }`}>
                                    <span className="status-icon">
                                        {usernameStatus.checking && '⏳'}
                                        {usernameStatus.available === true && '✓'}
                                        {usernameStatus.available === false && '✗'}
                                    </span>
                                    {usernameStatus.message}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <input
                            type="email"
                            id="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
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
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                placeholder="Retype Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? (
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
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || usernameStatus.checking || usernameStatus.available === false}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="auth-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    )
}

export default Register
