const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    caloriesBurned: {
        type: Number,
        required: true
    },
    totalTime: {
        type: Number, // in minutes
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema); 