import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    iconUrl: {
        type: String,
        required: true
    },
    criteria: {
        type: Object,
        required: true // Store criteria logic or definition here
    },
    threshold: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export const Badge = mongoose.model('Badge', BadgeSchema);
