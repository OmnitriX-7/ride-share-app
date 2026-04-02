import { Request, Response, NextFunction } from 'express';
import { sb } from '../config/supabase';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // The middleware has already guaranteed that:
  // 1. email, password, and confirmPassword exist
  // 2. password === confirmPassword
  // 3. email format is valid
  // 4. password meets strength requirements

  const { data, error } = await sb.auth.signUp({
    email,
    password,
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