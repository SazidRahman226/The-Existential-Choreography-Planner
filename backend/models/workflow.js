import mongoose from 'mongoose';

const WorkflowSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived', 'draft'],
        default: 'draft'
    },
    completionBonus: {
        type: Number,
        default: 0
    },
    // Visualization Data
    flowData: {
        type: Object, // Stores React Flow nodes, edges, viewport
        default: {}
    },
    thumbnail: {
        type: String, // URL/Path to preview image
        default: ''
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Workflow = mongoose.model('Workflow', WorkflowSchema);
