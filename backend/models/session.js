import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    emoji: {
        type: String,
        default: '🎵'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['system', 'user'],
        default: 'user'
    },
    youtubePlaylistUrl: {
        type: String,
        default: ''
    },
    quotes: [{
        type: String
    }],
    quoteInterval: {
        type: Number,
        default: 20,
        min: 5,
        max: 120
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const Session = mongoose.model('Session', SessionSchema);
