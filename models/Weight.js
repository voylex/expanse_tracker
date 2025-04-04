const mongoose = require('mongoose');

const weightSchema = new mongoose.Schema({
    lb: {
        type: Number,
        required: true
    },
    kg: {
        type: Number,
        required: false
    },
    date: {
        type: Date,
        default: function() {
            // Create a date object for today at midnight in the local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    }
});

// Pre-save middleware to convert lb to kg
weightSchema.pre('save', function(next) {
    this.kg = this.lb * 0.453592; // Convert lb to kg
    next();
});

module.exports = mongoose.model('Weight', weightSchema); 