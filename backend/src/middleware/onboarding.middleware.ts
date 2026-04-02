import { Request, Response, NextFunction } from 'express';
import { sb } from '../config/supabase';

export const enforceOnboardingTrap = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers['user-id'] as string || req.body.id;

  if (!userId) {
    return res.status(400).json({ error: "User ID missing" });
  }

  const { data, error } = await sb
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return res.status(403).json({
      trap: true,
      message: "Profile missing. Redirect to onboarding questions."
    });
  }

  next();
};