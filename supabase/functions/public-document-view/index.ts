// Public document view - returns only minimal, non-sensitive fields for QR access
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: doc, error } = await supabase
      .from('fiscal_documents')
      .select('id, document_type, document_number, status, action_date, created_at, deadline_date, pdf_url, establishment_id')
      .eq('id', id)
      .in('status', ['sent', 'archived'])
      .maybeSingle();

    if (error || !doc) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let establishment: any = null;
    if (doc.establishment_id) {
      const { data: est } = await supabase
        .from('establishments')
        .select('nome_fantasia, razao_social, cnpj, endereco, responsavel_nome')
        .eq('id', doc.establishment_id)
        .maybeSingle();
      establishment = est;
    }

    let pdfUrl: string | null = null;
    if (doc.pdf_url) {
      const { data: signed } = await supabase.storage
        .from('fiscal-photos')
        .createSignedUrl(doc.pdf_url, 60 * 60 * 24 * 7); // 7 days
      pdfUrl = signed?.signedUrl ?? null;
    }

    const { establishment_id, pdf_url, ...safeDoc } = doc as any;

    return new Response(
      JSON.stringify({ document: safeDoc, establishment, pdfUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
