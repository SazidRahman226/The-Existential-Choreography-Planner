import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flow',
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
    },
    // Game Mechanics & UI
    energyCost: {
        type: Number,
        default: 10
    },
    pointsReward: {
        type: Number,
        default: 50
    },
    description: {
        type: String,
        default: ''
    },
    nodeId: {
        type: String, // ID of the visual node in React Flow
        required: true
    }
}, {
    timestamps: true
});

export const Task = mongoose.model('Task', TaskSchema);
