const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.render('index', { expenses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new expense
router.post('/add', async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();
        res.redirect('/');
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
