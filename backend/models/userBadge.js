import mongoose from 'mongoose';

const UserBadgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const UserBadge = mongoose.model('UserBadge', UserBadgeSchema);
