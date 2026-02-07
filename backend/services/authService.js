import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/user.js';
import { UserProfile } from '../models/userProfile.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Generate access token
export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Generate refresh token
export const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
};

// Generate both tokens
export const generateTokens = (user) => {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
};

// Register a new user
export const registerUser = async ({ fullName, username, email, password }) => {
    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
            throw new Error('Email already registered');
        }
        throw new Error('Username already taken');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword
    });

    await user.save();

    // Create User Profile
    try {
        const userProfile = new UserProfile({
            userId: user._id
        });
        await userProfile.save();

        // Update User with Profile ID
        user.userProfileId = userProfile._id;
        await user.save();
    } catch (error) {
        // If profile creation fails, we should ideally delete the user to maintain consistency
        // For MVP, we'll log it. In production, we'd use a transaction.
        console.error('Error creating user profile:', error);
        await User.findByIdAndDelete(user._id);
        throw new Error('Error creating user profile. Registration failed.');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return { user: userResponse, ...tokens };
};

// Verify refresh token and issue new tokens
export const refreshTokens = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Update refresh token in database
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return tokens;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

// Logout - invalidate refresh token
export const logout = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// Forgot Password - Generate and save reset token
export const forgotPassword = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new Error('User not found');
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    return resetToken;
};

// Reset Password - Verify token and update password
export const resetPassword = async (resetToken, newPassword) => {
    // Get hashed token
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Invalid or expired token');
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Generate new tokens so they can be logged in automatically
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    return { user: userResponse, ...tokens };
};
