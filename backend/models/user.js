import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    userProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserProfile'
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    // Gamification & Stats
    energy: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    lastEnergyRegen: {
        type: Date,
        default: Date.now
    },
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    lastSessionDate: {
        type: Date,
        default: null
    },
    badges: [{
        key: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now }
    }],
    stats: {
        tasksCompleted: { type: Number, default: 0 },
        personalRecords: { type: Number, default: 0 },
        focusTasks: { type: Number, default: 0 },
        earlyFinishes: { type: Number, default: 0 },
        zenTasks: { type: Number, default: 0 },
        rouletteWins: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 },
        flowsCompleted: { type: Number, default: 0 },
        flowsCreated: { type: Number, default: 0 },
        consecutiveDays: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: null },
        pinnedFlows: { type: Number, default: 0 },
        perfectRuns: { type: Number, default: 0 },
        nightTasks: { type: Number, default: 0 },
        earlyTasks: { type: Number, default: 0 },
        comebacks: { type: Number, default: 0 },
        consecutiveFails: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

UserSchema.methods.updateEnergy = async function () {
    if (this.energy >= 100) {
        this.lastEnergyRegen = new Date();
        if (this.isModified('lastEnergyRegen')) await this.save();
        return;
    }

    const now = new Date();
    const lastRegen = new Date(this.lastEnergyRegen || now);
    const elapsed = now - lastRegen; // in ms
    const MS_PER_ENERGY = 6 * 60 * 1000; // 6 minutes per 1 energy (10 per hour)

    const energyGain = Math.floor(elapsed / MS_PER_ENERGY);

    if (energyGain > 0) {
        let newEnergy = this.energy + energyGain;
        if (newEnergy >= 100) {
            this.energy = 100;
            this.lastEnergyRegen = now;
        } else {
            this.energy = newEnergy;
            // Advance time by the energy gained to keep the remainder
            this.lastEnergyRegen = new Date(lastRegen.getTime() + (energyGain * MS_PER_ENERGY));
        }
        await this.save();
    }
};

export const User = mongoose.model('User', UserSchema);
