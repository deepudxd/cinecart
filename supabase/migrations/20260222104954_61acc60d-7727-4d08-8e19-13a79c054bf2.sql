
-- Fix permissive UPDATE on seats - only allow updating unbooked seats
DROP POLICY "Authenticated users can book seats" ON public.seats;
CREATE POLICY "Authenticated users can book seats" ON public.seats 
  FOR UPDATE TO authenticated 
  USING (is_booked = false)
  WITH CHECK (is_booked = true);
