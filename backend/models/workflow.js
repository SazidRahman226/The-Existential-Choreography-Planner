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
    }
}, {
    timestamps: true
});

export const Workflow = mongoose.model('Workflow', WorkflowSchema);
