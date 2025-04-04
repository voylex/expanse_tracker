const express = require('express');
const router = express.Router();
const Weight = require('../models/Weight');

// Get all weights
router.get('/', async (req, res) => {
    try {
        const weights = await Weight.find().sort({ date: -1 });
        res.json(weights);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false });
    }
});

// Add new weight
router.post('/add', async (req, res) => {
    try {
        console.log('Received weight data:', req.body);
        const { lb } = req.body;
        
        if (!lb || isNaN(lb)) {
            console.error('Invalid weight value:', lb);
            return res.status(400).send('Invalid weight value');
        }

        // Create weight record with lb only, kg will be calculated by pre-save middleware
        const weight = new Weight({
            lb: parseFloat(lb),
            date: new Date()
        });

        console.log('Creating weight record:', weight);
        await weight.save();
        console.log('Weight saved successfully:', weight);
        res.redirect('/');
    } catch (error) {
        console.error('Error adding weight:', error);
        res.status(500).send('Error adding weight: ' + error.message);
    }
});

// Delete weight
router.delete('/:id', async (req, res) => {
    try {
        await Weight.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router; 