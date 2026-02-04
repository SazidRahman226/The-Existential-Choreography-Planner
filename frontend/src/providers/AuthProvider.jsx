import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = 'http://localhost:3000/api/auth'

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check if user is authenticated (using cookies)
    const checkAuth = async () => {
        try {
            // Try to fetch profile
            const response = await fetch(`${API_URL}/profile`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            } else {
                // If profile fetch fails (e.g. 401), try to refresh token
                await refreshAccessToken()
            }
        } catch (err) {
            console.error('Auth check error:', err)
            // Even on error, we stop loading
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkAuth()
    }, [])

    // Refresh access token (using httpOnly cookie)
    const refreshAccessToken = async () => {
        try {
            const response = await fetch(`${API_URL}/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })

            if (response.ok) {
                // Token refreshed, now fetch profile
                const profileResponse = await fetch(`${API_URL}/profile`, {
                    credentials: 'include'
                })
                if (profileResponse.ok) {
                    const data = await profileResponse.json()
                    setUser(data.user)
                    return true
                }
            }

            // If refresh fails or profile fetch fails after refresh
            setUser(null)
            return false
        } catch (err) {
            console.error('Token refresh error:', err)
            setUser(null)
            return false
        }
    }

    // Register new user
    const register = async (fullName, username, email, password) => {
        setError(null)
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, username, email, password }),
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed')
            }

            setUser(data.user)
            return { success: true, user: data.user }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }

    // Login user
    const login = async (email, password) => {
        setError(null)
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Login failed')
            }

            setUser(data.user)
            return { success: true, user: data.user }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }

    // Logout user
    const logout = async () => {
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            })
        } catch (err) {
            console.error('Logout error:', err)
        }
        setUser(null)
        setError(null)
    }

    // Expose value
    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        checkAuth // Expose incase manual re-check needed
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
