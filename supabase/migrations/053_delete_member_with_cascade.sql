-- Migration: Create function to safely delete a profile with all dependencies
CREATE OR REPLACE FUNCTION public.delete_member_with_cascade(member_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  BEGIN
    -- Delete the profile - FK CASCADE will handle all dependencies
    DELETE FROM public.profiles WHERE id = member_id;
    
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but return false
    RAISE NOTICE 'Error deleting member: %', SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_member_with_cascade(UUID) TO authenticated;
