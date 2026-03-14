const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    role: {
        type: String,
        enum: ['citizen', 'Swachhta Mitra'],
        default: 'citizen'
    },
    zone: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    avatar: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    rewardPoints: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    dailyScore: {
        type: Number,
        default: 0
    },
    lastScoreUpdate: {
        type: Date,
        default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isGoogleAuth: {
        type: Boolean,
        default: false
    },
    headline: {
        type: String,
        default: ""
    },
    pronouns: {
        type: String,
        default: ""
    },
    school: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: "",
        lowercase: true,
        trim: true
    },
    area: {
        type: String,
        default: "",
        lowercase: true,
        trim: true
    },
    postalCode: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// 🔥 AUTHORITATIVE SCORING SYSTEM (Backend Driven)
UserSchema.methods.addPoints = function (points) {
    const now = new Date();
    const last = this.lastScoreUpdate;
    
    // Check if same day (UTC for absolute accuracy)
    const isSameDay = last && new Date(last).toDateString() === now.toDateString();

    if (isSameDay) {
        this.dailyScore += points;
    } else {
        // Reset daily if it's a new day
        this.dailyScore = points;
    }

    this.totalScore += points;
    this.rewardPoints = this.totalScore; // Keep rewardPoints in sync
    this.lastScoreUpdate = now;

    return this.save();
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
