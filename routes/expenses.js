const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const Weight = require('../models/Weight');

// Get all expenses and activities
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        const activities = await Activity.find().sort({ date: -1 });
        const weights = await Weight.find().sort({ date: -1 });

        // Group expenses and activities by week
        const weeklyData = [];
        const expensesByWeek = {};
        const activitiesByWeek = {};

        // Helper function to get week start date
        const getWeekStart = (date) => {
            const d = new Date(date);
            // Set to midnight in local timezone
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - d.getDay());
            return d;
        };

        // Helper function to get date string in PST timezone
        const getDateString = (date) => {
            const d = new Date(date);
            // Convert to PST (UTC-8)
            const pstDate = new Date(d.getTime() - (8 * 60 * 60 * 1000));
            // Set to midnight in PST
            pstDate.setUTCHours(0, 0, 0, 0);
            return pstDate.toISOString().split('T')[0];
        };

        // Helper function to get previous day's date string in PST
        const getPreviousDayString = (date) => {
            const d = new Date(date);
            // Convert to PST (UTC-8)
            const pstDate = new Date(d.getTime() - (8 * 60 * 60 * 1000));
            // Set to midnight in PST
            pstDate.setUTCHours(0, 0, 0, 0);
            // Subtract one day
            pstDate.setUTCDate(pstDate.getUTCDate() - 1);
            return pstDate.toISOString().split('T')[0];
        };

        // Helper function to normalize date to PST midnight
        const normalizeToPSTMidnight = (date) => {
            const d = new Date(date);
            // Convert to PST (UTC-8)
            const pstDate = new Date(d.getTime() - (8 * 60 * 60 * 1000));
            // Set to midnight in PST
            pstDate.setUTCHours(0, 0, 0, 0);
            return pstDate;
        };

        // Group expenses by week
        expenses.forEach(expense => {
            const weekStart = getWeekStart(expense.date);
            if (!expensesByWeek[weekStart]) {
                expensesByWeek[weekStart] = {
                    weekStart,
                    total: 0,
                    dailyExpenses: {}
                };
            }
            expensesByWeek[weekStart].total += expense.amount;

            // Group by day within week
            const dateStr = getDateString(expense.date);
            if (!expensesByWeek[weekStart].dailyExpenses[dateStr]) {
                expensesByWeek[weekStart].dailyExpenses[dateStr] = {
                    expenses: [],
                    totalCalories: 0
                };
            }
            expensesByWeek[weekStart].dailyExpenses[dateStr].expenses.push(expense);
            expensesByWeek[weekStart].dailyExpenses[dateStr].totalCalories += expense.calories || 0;
        });

        // Group activities by week
        activities.forEach(activity => {
            const weekStart = getWeekStart(activity.date);
            if (!activitiesByWeek[weekStart]) {
                activitiesByWeek[weekStart] = {
                    dailyActivities: {}
                };
            }

            // Group by day within week
            const dateStr = getDateString(activity.date);
            if (!activitiesByWeek[weekStart].dailyActivities[dateStr]) {
                activitiesByWeek[weekStart].dailyActivities[dateStr] = {
                    activities: [],
                    totalCaloriesBurned: 0,
                    totalTime: 0
                };
            }
            activitiesByWeek[weekStart].dailyActivities[dateStr].activities.push(activity);
            activitiesByWeek[weekStart].dailyActivities[dateStr].totalCaloriesBurned += activity.caloriesBurned;
            activitiesByWeek[weekStart].dailyActivities[dateStr].totalTime += activity.totalTime;
        });

        // Combine expenses and activities data
        Object.keys(expensesByWeek).forEach(weekStart => {
            const weekData = expensesByWeek[weekStart];
            const weekActivities = activitiesByWeek[weekStart] || { dailyActivities: {} };

            // Calculate daily net calories and add weight data
            Object.keys(weekData.dailyExpenses).forEach(dateStr => {
                const dayExpenses = weekData.dailyExpenses[dateStr];
                const dayActivities = weekActivities.dailyActivities[dateStr] || { totalCaloriesBurned: 0 };
                
                // Calculate net calories: total calories from expenses - (total calories burned from activities + 1900 base calories)
                dayExpenses.netCalories = dayExpenses.totalCalories - (dayActivities.totalCaloriesBurned + 1900);
            });

            weeklyData.push({
                weekStart: new Date(weekStart),
                total: weekData.total,
                dailyExpenses: weekData.dailyExpenses,
                dailyActivities: weekActivities.dailyActivities
            });
        });

        // Sort weeks by date (most recent first)
        weeklyData.sort((a, b) => b.weekStart - a.weekStart);

        // Sort weights by date (most recent first)
        weights.sort((a, b) => b.date - a.date);

        // Create a map of date strings to net calories for quick lookup
        const netCaloriesMap = {};
        weeklyData.forEach(week => {
            Object.entries(week.dailyExpenses).forEach(([date, dayData]) => {
                netCaloriesMap[date] = dayData.netCalories;
            });
        });

        res.render('index', { 
            weeklyData, 
            weights,
            netCaloriesMap
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
    }
});

// Add new expense
router.post('/add', async (req, res) => {
    try {
        const { description, amount, calories } = req.body;
        const expense = new Expense({
            description,
            amount: parseFloat(amount),
            calories: parseInt(calories) || 0,
            date: new Date()
        });
        await expense.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error adding expense');
    }
});

// Update expense calories
router.put('/:id', async (req, res) => {
    try {
        const { calories } = req.body;
        await Expense.findByIdAndUpdate(req.params.id, { calories: parseInt(calories) || 0 });
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
