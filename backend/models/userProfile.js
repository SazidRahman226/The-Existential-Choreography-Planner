import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stats: {
        type: Object,
        default: {}
    },
    badgeId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge'
    }],
    workflowId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workflow'
    }]
});

export const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
