/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId: data.claims.sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const { cnpj, establishmentId } = await req.json();
    if (!cnpj) {
      return new Response(JSON.stringify({ error: "CNPJ não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limpar CNPJ - apenas números
    const cleanCnpj = cnpj.replace(/\D/g, "").slice(0, 14);
    if (cleanCnpj.length !== 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[fetch-cnae] Buscando CNAE para CNPJ: ${cleanCnpj}`);

    // Consultar BrasilAPI
    const apiResp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

    if (!apiResp.ok) {
      console.warn(`[fetch-cnae] BrasilAPI retornou ${apiResp.status} para CNPJ ${cleanCnpj} - pode ser CNPJ inexistente, inativo ou MEI não registrado`);
      return new Response(JSON.stringify({ 
        error: "CNPJ não encontrado na base da Receita Federal",
        cnpj: cleanCnpj,
        skipped: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await apiResp.json();

    const cnaePrincipal = data.cnae_fiscal?.toString() || null;
    const cnaeDescricao = data.cnae_fiscal_descricao || null;
    const nomeFantasia = data.nome_fantasia || null;
    const razaoSocial = data.razao_social || null;

    console.log(`[fetch-cnae] CNAE: ${cnaePrincipal} - ${cnaeDescricao}`);

    // Se tiver establishmentId, atualizar o estabelecimento no banco
    // Uses the authenticated user's context so RLS enforces ownership checks
    if (establishmentId && cnaePrincipal) {
      const authHeader = req.headers.get("authorization")!;
      const userSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { error: updateError } = await userSupabase
        .from("establishments")
        .update({ cnae_principal: cnaePrincipal })
        .eq("id", establishmentId);

      if (updateError) {
        console.error(`[fetch-cnae] Update error:`, updateError);
      } else {
        console.log(`[fetch-cnae] Estabelecimento ${establishmentId} atualizado com CNAE ${cnaePrincipal}`);
      }
    }

    return new Response(
      JSON.stringify({
        cnae_principal: cnaePrincipal,
        cnae_descricao: cnaeDescricao,
        nome_fantasia: nomeFantasia,
        razao_social: razaoSocial,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[fetch-cnae] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});