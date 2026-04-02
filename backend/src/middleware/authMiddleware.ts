import { Request, Response, NextFunction } from 'express';
import { isEmailValid, isPasswordStrong } from '../utils/validators';
import { AppError } from '../utils/AppError';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, confirmPassword } = req.body;

  // 1. Check if fields exist
  if (!email || !password || !confirmPassword) {
    return next(new AppError('Email, password, and confirm password are required', 400));
  }

  // 2. Check email format using our Util
  if (!isEmailValid(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // 3. Check password strength using our Util
  if (!isPasswordStrong(password)) {
    return next(new AppError('Password must be at least 8 characters long and must have an uppercase letter, a number, and a symbol.', 400));
  }

  // 4. Check if passwords match
  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // 5. Success! Move to the next function (the Controller)
  next();
};