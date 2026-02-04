import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    // Basic user info
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Passport.js / Authentication fields
    password: {
        type: String,
        required: true,
        select: false  // Won't be returned in queries by default
    },

    // Profile info
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: ''
    },

    // Account status
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // For password reset functionality
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },

    // For refresh token (JWT)
    refreshToken: {
        type: String,
        select: false
    }

}, {
    timestamps: true  // adds createdAt and updatedAt automatically
});

export const User = mongoose.model('User', UserSchema);
