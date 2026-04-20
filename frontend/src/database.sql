-- 1. TABLES (Using IF NOT EXISTS so it doesn't error on existing tables)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  role text CHECK (role IN ('rider', 'driver')),
  phone_number text,
  onboarded boolean DEFAULT false,
  age int4,
  gender text,
  hometown text,
  bio text,
  avatar_url text,
  exp int4 DEFAULT 0,
  level int4 DEFAULT 1,
  referred_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Fixed: Included 'busy' status which is used in DriverView.tsx
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'available', 'busy')),
  vehicle_model TEXT,
  car_plate_number TEXT,
  rating DECIMAL(3,2) DEFAULT 5.00,
  base_fare DECIMAL(10,2) DEFAULT 20.00, 
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_percent INT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false,
  is_referral_reward BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active')), 
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_coupon UNIQUE (user_id, code)
);

CREATE TABLE IF NOT EXISTS public.ride_dispatches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES auth.users(id) NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) NOT NULL,
  pickup_name TEXT NOT NULL,
  dropoff_name TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  fare_amount DECIMAL(10,2) NOT NULL,
  -- Fixed: Included 'completed' status which is used in finishRide logic
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'timeout', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. POLICIES
ALTER TABLE public.ride_dispatches REPLICA IDENTITY FULL;
ALTER TABLE public.drivers REPLICA IDENTITY FULL;
ALTER TABLE public.coupons REPLICA IDENTITY FULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_dispatches ENABLE ROW LEVEL SECURITY;

-- Profile Policies
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
-- Fixed: Changed to public view so riders and drivers can see each other's names/photos
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Driver Policies
DROP POLICY IF EXISTS "Anyone view drivers" ON public.drivers;
CREATE POLICY "Anyone view drivers" ON public.drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers update self" ON public.drivers;
CREATE POLICY "Drivers update self" ON public.drivers FOR UPDATE USING (auth.uid() = id);

-- Dispatch Policies
DROP POLICY IF EXISTS "Riders view dispatches" ON public.ride_dispatches;
CREATE POLICY "Riders view dispatches" ON public.ride_dispatches FOR SELECT USING (auth.uid() = rider_id);

DROP POLICY IF EXISTS "Drivers view dispatches" ON public.ride_dispatches;
CREATE POLICY "Drivers view dispatches" ON public.ride_dispatches FOR SELECT USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Riders can create dispatches" ON public.ride_dispatches;
CREATE POLICY "Riders can create dispatches" ON public.ride_dispatches FOR INSERT WITH CHECK (auth.uid() = rider_id);

DROP POLICY IF EXISTS "Participants update dispatches" ON public.ride_dispatches;
CREATE POLICY "Participants update dispatches" ON public.ride_dispatches FOR UPDATE USING (auth.uid() = rider_id OR auth.uid() = driver_id);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_dispatches;
  EXCEPTION WHEN others THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
  EXCEPTION WHEN others THEN NULL; END;
END $$;

-- 3. FUNCTIONS & TRIGGERS

-- Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- XP Logic Function (Using subquery assignment to avoid relation errors)
CREATE OR REPLACE FUNCTION public.handle_xp_gain(target_user_id UUID, xp_to_add INT4)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    v_exp INT4;
    v_lv  INT4;
    v_new_total INT4;
    v_step INT4 := 100; 
BEGIN
    v_exp := (SELECT exp FROM public.profiles WHERE id = target_user_id);
    v_lv  := (SELECT level FROM public.profiles WHERE id = target_user_id);
    
    v_exp := COALESCE(v_exp, 0) + xp_to_add;
    v_lv  := COALESCE(v_lv, 1);
    
    WHILE v_exp >= v_step LOOP
        v_lv := v_lv + 1;
        v_exp := v_exp - v_step;
    END LOOP;
    
    UPDATE public.profiles SET exp = v_exp, level = v_lv WHERE id = target_user_id;
END;
$$;

-- Ride Completed XP Trigger
CREATE OR REPLACE FUNCTION public.on_ride_completed_award_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
        PERFORM public.handle_xp_gain(NEW.rider_id, 20);
        PERFORM public.handle_xp_gain(NEW.driver_id, 20);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ride_completed_xp ON public.ride_dispatches;
CREATE TRIGGER trigger_ride_completed_xp
AFTER UPDATE ON public.ride_dispatches
FOR EACH ROW
EXECUTE FUNCTION public.on_ride_completed_award_xp();

-- Nearby Drivers RPC
CREATE OR REPLACE FUNCTION get_nearby_drivers(rider_lat double precision, rider_lng double precision, radius_km double precision)
RETURNS TABLE(id uuid, name text, vehicle text, plate text, fare numeric, rating numeric, lat double precision, lng double precision, distance double precision) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    p.full_name,
    d.vehicle_model,
    d.car_plate_number,
    d.base_fare,
    d.rating,
    d.lat,
    d.lng,
    (6371 * acos(cos(radians(rider_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(rider_lng)) + sin(radians(rider_lat)) * sin(radians(d.lat)))) AS distance
  FROM drivers d
  JOIN profiles p ON d.id = p.id
  WHERE d.status = 'available'
    AND (6371 * acos(cos(radians(rider_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(rider_lng)) + sin(radians(rider_lat)) * sin(radians(d.lat)))) < radius_km
  ORDER BY distance;
END;
$$;
-- Enable Realtime for the tables involved in real-time features
-- This is critical for postgres_changes listeners in the frontend to receive events.
DO $$
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables individually (wrapped in sub-blocks to ignore "already exists" errors)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_dispatches;
  EXCEPTION WHEN others THEN NULL; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
  EXCEPTION WHEN others THEN NULL; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
  EXCEPTION WHEN others THEN NULL; END;
END $$;