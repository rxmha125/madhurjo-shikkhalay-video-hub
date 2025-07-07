
-- Update the handle_new_user function to set admin for the new email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, is_admin, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.email = 'mamadhurjo.shikkhalay@gmail.com',
    '/lovable-uploads/824dd225-357b-421b-af65-b70d6610c554.png'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update any existing profile with the old admin email to remove admin status
UPDATE public.profiles 
SET is_admin = false 
WHERE email = 'hkhero50@gmail.com';

-- Update any existing profile with the new admin email to grant admin status
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'mamadhurjo.shikkhalay@gmail.com';
