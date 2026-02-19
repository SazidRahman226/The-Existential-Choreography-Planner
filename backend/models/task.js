import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    workflowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workflow'
    },
    nodeId: {
        type: String
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
        enum: ['pending', 'in-progress', 'completed', 'failed'],
        default: 'pending'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    points: {
        type: Number,
        default: 0
    },
    pointsReward: {
        type: Number,
        default: 50
    },
    energyCost: {
        type: Number,
        default: 10
    },
    duration: {
        type: Number,
        default: 30
    },
    history: [{
        date: { type: Date, default: Date.now },
        outcome: { type: String, enum: ['completed', 'completed_late', 'failed', 'skipped'] },
        reason: String,
        note: String,
        actualTime: Number,
        estimatedTime: Number,
        earnedXP: Number
    }],
    bestTime: {
        type: Number,
        default: null
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

