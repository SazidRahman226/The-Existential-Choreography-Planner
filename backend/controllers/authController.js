import passport from 'passport';
import { registerUser, generateTokens, refreshTokens, logout } from '../services/authService.js';
import { User } from '../models/user.js';

// Helper to set cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: 'strict',   // CSRF protection
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// Register new user
export const register = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Validate required fields
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required: fullName, username, email, password'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        const result = await registerUser({ fullName, username, email, password });

        // Set cookies
        setTokenCookies(res, result.accessToken, result.refreshToken);

        res.status(201).json({
            message: 'Registration successful',
            user: result.user
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login with email and password
export const login = (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Set cookies
        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            message: 'Login successful',
            user
        });
    })(req, res, next);
};

// Refresh access token
export const refresh = async (req, res) => {
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        const tokens = await refreshTokens(refreshToken);

        // Set new cookies
        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            message: 'Tokens refreshed successfully'
        });
    } catch (error) {
        // Clear invalid cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(401).json({ message: error.message });
    }
};

// Logout
export const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            await logout(req.user._id);
        }

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

// Get current user profile
export const getProfile = (req, res) => {
    res.json({ user: req.user });
};

// Check username availability
export const checkUsername = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || username.length < 3) {
            return res.json({ available: false, message: 'Username must be at least 3 characters' });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });

        if (existingUser) {
            return res.json({ available: false, message: 'Username is already taken' });
        }

        res.json({ available: true, message: 'Username is available' });
    } catch (error) {
        res.status(500).json({ message: 'Error checking username' });
    }
};
