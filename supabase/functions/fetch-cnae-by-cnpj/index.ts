/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const ALLOWED_ORIGINS = [
  "https://fiscaliz.lovable.app",
  "https://id-preview--4a07efe0-5065-4b28-9142-91e42ddd1344.lovable.app",
  "http://localhost:5173",
  "http://localhost:8100",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cnpj, establishmentId } = await req.json();
    if (!cnpj) {
      return new Response(JSON.stringify({ error: "CNPJ não fornecido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limpar CNPJ - apenas números
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length < 14) {
      return new Response(JSON.stringify({ error: "CNPJ inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[fetch-cnae] Buscando CNAE para CNPJ: ${cleanCnpj}`);

    // Consultar BrasilAPI
    const apiResp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

    if (!apiResp.ok) {
      console.error(`[fetch-cnae] BrasilAPI error: ${apiResp.status}`);
      return new Response(JSON.stringify({ error: "CNPJ não encontrado na base da Receita Federal" }), {
        status: 404,
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
    if (establishmentId && cnaePrincipal) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
