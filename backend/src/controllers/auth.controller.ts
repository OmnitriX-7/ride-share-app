import { Request, Response, NextFunction } from 'express';
import { sb } from '../config/supabase';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const reg = catchAsync(async (req: Request, res: Response, nxt: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return nxt(new AppError('Missing required fields', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`Registration Blocked: Invalid Email Format (${email}) ❌`);
    return nxt(new AppError('Please provide a valid email address', 400));
  }

  const { data, error } = await sb.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: name
      }
    }
  });

  if (error) {
    // Log the failure to your terminal
    console.error("User registration failed:", error.message);
    return nxt(new AppError(error.message, error.status || 400));
  }

  // Log the success to your terminal
  if (data.user) {
    console.log("User registration passed:", data.user.email);
  }

  res.status(201).json({
    st: 'ok',
    d: data
  });
});