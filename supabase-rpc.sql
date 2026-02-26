-- Run this AFTER the main migration in Supabase SQL Editor
-- Creates an RPC function to get the next order number

CREATE OR REPLACE FUNCTION nextval(seq_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN nextval(seq_name::regclass);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION nextval(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION nextval(TEXT) TO authenticated;
