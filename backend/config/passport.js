import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js';

// Local Strategy - for login with email/username + password
passport.use(new LocalStrategy(
    {
        usernameField: 'email',  // Use email as the login identifier
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            // Find user by email and include password field
            const user = await User.findOne({ email: email.toLowerCase() })
                .select('+password');

            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Check if account is active
            if (!user.isActive) {
                return done(null, false, { message: 'Account is deactivated' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Remove password from user object before returning
            const userObject = user.toObject();
            delete userObject.password;

            return done(null, userObject);
        } catch (error) {
            return done(error);
        }
    }
));

// Custom cookie extractor
const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['accessToken'];
    }
    return token;
};

// JWT Strategy - for authenticating protected routes
const jwtOptions = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        const user = await User.findById(payload.id);

        if (!user) {
            return done(null, false);
        }

        if (!user.isActive) {
            return done(null, false, { message: 'Account is deactivated' });
        }

        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));

export default passport;
