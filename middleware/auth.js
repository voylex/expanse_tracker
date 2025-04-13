const isAuthenticated = (req, res, next) => {
    const authToken = req.cookies.authToken;
    const validToken = process.env.AUTH_TOKEN || '1234';
    
    if (authToken === validToken) {
        return next();
    }
    res.redirect('/login');
};

module.exports = {
    isAuthenticated
}; 