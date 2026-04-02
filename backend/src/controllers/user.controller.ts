import { Request, Response } from 'express';
import { sb } from '../config/supabase';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['user-id'] as string) || req.body.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID missing from request" });
    }

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({ data });
  } catch (err: any) {
    return res.status(500).json({ error: "Server error during profile check", details: err.message });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const { id, fullname, phoneNo, role } = req.body;

    if (!id || !fullname || !phoneNo || !role) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        received: { id, fullname, phoneNo, role } 
      });
    }

    const { data, error } = await sb
      .from('profiles')
      .upsert({ 
        id: id,
        full_name: fullname, 
        phone_number: phoneNo, 
        role: role 
      })
      .select();

    if (error) {
      console.error("Supabase Error Details:", error);
      return res.status(500).json({ 
        error: "Supabase error", 
        message: error.message, 
        code: error.code,
        hint: error.hint 
      });
    }

    return res.status(200).json({ message: "Profile created successfully", data });
  } catch (err: any) {
    console.error("Critical Server Crash:", err);
    return res.status(500).json({ 
      error: "Internal server crash", 
      message: err.message 
    });
  }
};