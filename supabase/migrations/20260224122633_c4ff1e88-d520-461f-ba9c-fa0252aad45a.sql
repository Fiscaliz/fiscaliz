
-- 1. Fix sync queue: replace ALL policy with separate INSERT/SELECT/UPDATE (no DELETE)
DROP POLICY IF EXISTS "Users can manage own sync queue" ON public.offline_sync_queue;

CREATE POLICY "Users can insert own sync queue"
  ON public.offline_sync_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sync queue"
  ON public.offline_sync_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sync queue"
  ON public.offline_sync_queue FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add admin-only write policies for checklists
CREATE POLICY "Admins can insert checklists"
  ON public.checklists FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update checklists"
  ON public.checklists FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete checklists"
  ON public.checklists FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Add admin-only write policies for document_sequences
CREATE POLICY "Admins can manage sequences"
  ON public.document_sequences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
