import passport from 'passport';

// Middleware to protect routes - requires valid JWT
export const authenticateJWT = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({
                message: info?.message || 'Unauthorized - Invalid or expired token'
            });
        }

        req.user = user;
        next();
    })(req, res, next);
};

// Middleware to optionally get user from JWT (doesn't block if no token)
export const optionalAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};
