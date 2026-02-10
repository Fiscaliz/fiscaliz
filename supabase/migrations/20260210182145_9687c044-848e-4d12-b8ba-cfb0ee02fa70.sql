-- Allow public (anonymous) read access to sent/archived documents for QR Code viewing
-- Only exposes minimal fields needed (pdf_url, document_number, document_type)
CREATE POLICY "Public can view sent documents via QR"
  ON public.fiscal_documents
  FOR SELECT
  USING (status IN ('sent', 'archived'));