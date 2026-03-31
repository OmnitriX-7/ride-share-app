import { Request, Response, NextFunction } from 'express';
import { sb } from '../config/supabase';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return next(new AppError('Email, password, and confirm password are required', 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`Registration Blocked: Invalid Email Format (${email})`);
    return next(new AppError('Please provide a valid email address', 400));
  }

  const { data, error } = await sb.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error("User registration failed:", error.message);
    return next(new AppError(error.message, error.status || 400));
  }

  if (data.user) {
    console.log("User registered!", data.user.email);
  }

  res.status(201).json({
    status: 'success',
    data: data
  });
});