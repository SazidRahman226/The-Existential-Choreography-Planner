import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workflow',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed'], // Added likely enums
        default: 'pending'
    },
    points: {
        type: Number,
        default: 0
    },
    prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    deadline: {
        type: Date
    }
}, {
    timestamps: true
});

export const Task = mongoose.model('Task', TaskSchema);
