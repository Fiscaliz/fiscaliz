-- Drop the existing UPDATE policy that's preventing the lock transition
DROP POLICY IF EXISTS "Users can update unlocked documents" ON public.fiscal_documents;

-- Create a new policy that allows users to update their own unlocked documents
-- AND allows the transition to lock the document (set is_locked = true)
CREATE POLICY "Users can update unlocked documents" 
ON public.fiscal_documents 
FOR UPDATE 
USING (auth.uid() = user_id AND is_locked = false)
WITH CHECK (auth.uid() = user_id);