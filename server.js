require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const activityRoutes = require('./routes/activities');
const weightRoutes = require('./routes/weights');

// Import authentication middleware
const { isAuthenticated } = require('./middleware/auth');

// Public routes (no authentication required)
app.use('/login', authRoutes);

// Protected routes (require authentication)
app.use('/', isAuthenticated, expenseRoutes);
app.use('/', isAuthenticated, activityRoutes);
app.use('/', isAuthenticated, weightRoutes);

// Redirect root to login if not authenticated
app.get('/', (req, res) => {
    const authToken = req.cookies.authToken;
    const validToken = process.env.AUTH_TOKEN || '1234';
    
    if (authToken === validToken) {
        res.redirect('/expenses');
    } else {
        res.redirect('/login');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
