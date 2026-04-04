import { Request, Response, NextFunction } from 'express';
import { sb } from '../config/supabase';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1. Destructure 'referredBy' along with email and password
  const { email, password, referredBy } = req.body;

  // --- THE DEBUGGING TRACKERS ---
  console.log("==== NEW REGISTRATION ATTEMPT ====");
  console.log("1. Full Body Received:", req.body);
  console.log("2. Extracted Email:", email);
  console.log("3. Extracted Referred By ID:", referredBy);
  console.log("==================================");
  // ------------------------------

  // 2. Pass 'referredBy' into the metadata so the SQL Trigger can see it
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        referred_by: referredBy, // This key MUST match what we used in the SQL Trigger
        full_name: "New StateRider" 
      }
    }
  });

  if (error) {
    console.error("User registration failed:", error.message);
    return next(new AppError(error.message, error.status || 400));
  }

  if (data.user) {
    console.log("User registered and referral tracked!", data.user.email);
  }

  res.status(201).json({
    status: 'success',
    data: data
  });
});