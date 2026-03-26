
-- Add user_id to checklists so users can own their own checklists
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Allow users to insert their own checklists
CREATE POLICY "Users can insert own checklists"
ON public.checklists FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own checklists
CREATE POLICY "Users can update own checklists"
ON public.checklists FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own checklists
CREATE POLICY "Users can delete own checklists"
ON public.checklists FOR DELETE TO authenticated
USING (auth.uid() = user_id);
