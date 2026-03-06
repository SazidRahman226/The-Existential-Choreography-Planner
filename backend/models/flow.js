import mongoose from 'mongoose';

const FlowSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    flowData: {
        type: Object, // Stores nodes and edges for React Flow
        required: true,
        default: { nodes: [], edges: [] }
    },
    thumbnail: {
        type: String,
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    publicStatus: {
        type: String,
        enum: ['private', 'pending', 'approved', 'rejected'],
        default: 'private'
    },
    reviewNote: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        default: []
    },
    cloneCount: {
        type: Number,
        default: 0
    },
    clonedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flow',
        default: null
    }
}, {
    timestamps: true
});

export const Flow = mongoose.model('Flow', FlowSchema);
