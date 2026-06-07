
CREATE TYPE public.marketplace_item_type AS ENUM ('report_template', 'checklist', 'ai_profile');
CREATE TYPE public.marketplace_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  type public.marketplace_item_type NOT NULL,
  title text NOT NULL,
  description text,
  area text,
  icon text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_cents integer NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  status public.marketplace_status NOT NULL DEFAULT 'pending',
  installs_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_items TO authenticated;
GRANT ALL ON public.marketplace_items TO service_role;

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view approved items"
  ON public.marketplace_items FOR SELECT
  TO authenticated
  USING (status = 'approved' OR author_id = auth.uid());

CREATE POLICY "author insert"
  ON public.marketplace_items FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "author update"
  ON public.marketplace_items FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "author delete"
  ON public.marketplace_items FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

CREATE TRIGGER trg_marketplace_items_updated
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.marketplace_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

GRANT SELECT, INSERT, DELETE ON public.marketplace_installs TO authenticated;
GRANT ALL ON public.marketplace_installs TO service_role;

ALTER TABLE public.marketplace_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own installs"
  ON public.marketplace_installs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_marketplace_items_status ON public.marketplace_items(status, type, created_at DESC);
CREATE INDEX idx_marketplace_items_author ON public.marketplace_items(author_id);
