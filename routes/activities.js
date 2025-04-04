const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Get all activities grouped by week
router.get('/', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ date: -1 });
        
        // Group activities by week
        const weeklyActivities = {};
        activities.forEach(activity => {
            const date = new Date(activity.date);
            // Get the start of the week (Monday)
            const weekStart = new Date(date);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0); // Set to start of day
            const weekKey = weekStart.toISOString().split('T')[0];
            
            if (!weeklyActivities[weekKey]) {
                weeklyActivities[weekKey] = {
                    activities: [],
                    dailyActivities: {} // Track activities by date
                };
            }
            
            weeklyActivities[weekKey].activities.push(activity);
            
            // Track daily activities
            const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
            if (!weeklyActivities[weekKey].dailyActivities[dateKey]) {
                weeklyActivities[weekKey].dailyActivities[dateKey] = {
                    activities: [],
                    totalCaloriesBurned: 0,
                    totalTime: 0
                };
            }
            
            weeklyActivities[weekKey].dailyActivities[dateKey].activities.push(activity);
            weeklyActivities[weekKey].dailyActivities[dateKey].totalCaloriesBurned += Number(activity.caloriesBurned);
            weeklyActivities[weekKey].dailyActivities[dateKey].totalTime += Number(activity.totalTime);
        });

        // Convert to array and sort by week (newest first)
        const weeklyData = Object.entries(weeklyActivities)
            .map(([weekStart, data]) => ({
                weekStart: new Date(weekStart),
                dailyActivities: data.dailyActivities
            }))
            .sort((a, b) => b.weekStart - a.weekStart);

        res.json(weeklyData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new activity
router.post('/add', async (req, res) => {
    try {
        const activity = new Activity(req.body);
        await activity.save();
        res.redirect('/');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete activity
router.delete('/:id', async (req, res) => {
    try {
        await Activity.findByIdAndDelete(req.params.id);
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 