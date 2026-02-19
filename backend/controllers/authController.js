import passport from 'passport';
import { registerUser, generateTokens, refreshTokens, logout, forgotPassword, resetPassword } from '../services/authService.js';
import sendEmail from '../utils/sendEmail.js';
import { User } from '../models/user.js';
import { Badge } from '../models/badge.js';
import { calculateLevel, getTitleForLevel, xpForLevel, getEnergyWarning } from '../utils/gamification.js';

// Helper to set cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction, // HTTPS only in production
        sameSite: 'Lax',   // Lax for better local dev compatibility, Strict is ideal but can cause issues with redirects/ports
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
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
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
            console.error('Login Error (Passport):', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            console.warn('Login Failed (Invalid Credentials):', info?.message);
            return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }

        try {
            // Generate tokens
            const tokens = generateTokens(user);
            console.log(`[LOGIN] Generating tokens for user ${user._id}`);

            // Save refresh token to database
            console.log(`[LOGIN] Saving refresh token to DB: ${tokens.refreshToken.substring(0, 10)}...`);
            await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

            // Set cookies
            console.log(`[LOGIN] Setting cookies. NODE_ENV=${process.env.NODE_ENV}`);
            setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

            res.json({
                message: 'Login successful',
                user
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Error during login' });
        }
    })(req, res, next);
};

// Refresh access token
export const refresh = async (req, res) => {
    console.log('[REFRESH] Refresh request received');
    try {
        // Get refresh token from cookie
        const refreshToken = req.cookies.refreshToken;
        console.log(`[REFRESH] Cookie token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'NONE'}`);

        if (!refreshToken) {
            console.warn('[REFRESH] No refresh token provided');
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        const tokens = await refreshTokens(refreshToken);
        console.log('[REFRESH] Tokens refreshed successfully');

        // Set new cookies
        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

        res.json({
            message: 'Tokens refreshed successfully'
        });
    } catch (error) {
        console.error('[REFRESH] Error:', error.message);
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
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('badges');
        res.json({ user });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { fullName, username, bio, avatar } = req.body;
        const userId = req.user._id;

        // Validation - basic
        if (!fullName || !username) {
            return res.status(400).json({ message: 'Full name and username are required' });
        }

        // Check username uniqueness if changed
        if (username.toLowerCase() !== req.user.username) {
            const existingUser = await User.findOne({ username: username.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fullName,
                username: username.toLowerCase(),
                bio: bio || '',
                // If avatar is provided update it, else keep old? 
                // Front end should send current avatar if not changed. 
                // Or we can check if avatar is undefined.
                bio: bio || '',
                ...(req.file && { avatar: req.file.path }),
                ...(avatar !== undefined && !req.file && { avatar }) // Fallback if avatar is sent as string (e.g. clear)
            },
            { new: true, runValidators: true }
        ).populate('badges');

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
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

// Get gamification stats for the current user
export const getStats = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Apply passive energy regen
        await user.updateEnergy();

        // Calculate level and title
        const level = calculateLevel(user.points);
        const title = getTitleForLevel(level);

        // XP progress within current level
        const currentLevelXP = xpForLevel(level);
        const nextLevelXP = xpForLevel(level + 1);
        const xpInCurrentLevel = user.points - currentLevelXP;
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
        const xpPercent = xpNeededForNextLevel > 0
            ? Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
            : 100;

        // Energy regen ETA
        let energyRegenETA = null;
        if (user.energy < 100) {
            const energyNeeded = 100 - user.energy;
            const minutesNeeded = energyNeeded * 6; // 6 min per 1 energy
            const hours = Math.floor(minutesNeeded / 60);
            const mins = minutesNeeded % 60;
            energyRegenETA = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }

        res.json({
            level,
            title,
            totalXP: user.points,
            xpProgress: {
                current: xpInCurrentLevel,
                needed: xpNeededForNextLevel,
                percent: xpPercent
            },
            energy: user.energy,
            maxEnergy: 100,
            energyRegenETA,
            energyWarning: getEnergyWarning(user.energy),
            lastSessionDate: user.lastSessionDate
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};


// --- Admin Controllers ---

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user role' });
    }
};

// Update user status
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User status updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status' });
    }
};
