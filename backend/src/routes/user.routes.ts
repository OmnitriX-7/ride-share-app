import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { completeOnboarding, getUserProfile } from '../controllers/user.controller';
import { enforceOnboardingTrap } from '../middleware/onboarding.middleware';
import { validateRegister } from '../middleware/authMiddleware'; // Import your new validation guard

const r = Router();

/**
 * AUTH ROUTES
 */

// Now protected by validateRegister: checks email format, password strength, and matches.
r.post('/register', validateRegister, register);

/**
 * ONBOARDING ROUTES
 */

// You can add a 'validateOnboarding' middleware here later to check phone numbers/names
r.post('/onboarding', completeOnboarding);

/**
 * PROTECTED USER ROUTES
 */

// These use the 'enforceOnboardingTrap' to ensure users can't skip the survey
r.get('/profile', enforceOnboardingTrap, getUserProfile); 

r.get('/home', enforceOnboardingTrap, (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: "Welcome to the home page" 
  });
});

export default r;