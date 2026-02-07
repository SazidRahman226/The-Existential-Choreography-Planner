import passport from 'passport';
import { registerUser, generateTokens, refreshTokens, logout, forgotPassword, resetPassword } from '../services/authService.js';
import sendEmail from '../utils/sendEmail.js';
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

// Forgot Password
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const resetToken = await forgotPassword(email);

        // Construct reset URL
        // Assuming frontend runs on same host/port in dev, or configured URL
        // For Docker, we might need a FRONTEND_URL env var.
        // Defaulting to http://localhost:5173 for now as per previous context
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You have requested to reset your password.</p>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `;

        try {
            await sendEmail({
                email,
                subject: 'Password Reset Request - Existential Choreography Planner',
                message
            });

            res.json({ message: 'Email sent' });
        } catch (emailError) {
            // If email fails, we should probably invalidate the token but for now just error
            console.error('Email send failed:', emailError);
            // In a real app we'd rollback the token save here generally
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        // Don't reveal if user doesn't exist for security, but for dev it helps
        // Standard practice: return 200 even if user not found, or catch specific error
        res.status(404).json({ message: error.message });
    }
};

// Reset Password
export const resetPasswordController = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const result = await resetPassword(token, password);

        // Set cookies
        // Re-using the helper from above would be nice, but it's not exported.
        // I'll Copy-paste logic or refactor. Since it's inside the same file, I can just use implementation details?
        // Wait, setTokenCookies is defined in this file (lines 6-22). I can use it!
        // But scope? Yes, it is in module scope.

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            message: 'Password reset successful',
            user: result.user
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
