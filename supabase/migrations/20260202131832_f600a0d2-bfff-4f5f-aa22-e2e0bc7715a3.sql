-- Allow users to delete their own draft documents
CREATE POLICY "Users can delete own draft documents" 
ON public.fiscal_documents 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'draft');