/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const onlyDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

function isValidCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, weight, index) => acc + Number(base[index]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${d1}${d2}`);
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 5500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildAddress(...parts: Array<string | null | undefined>) {
  return parts.map((part) => String(part ?? '').trim()).filter(Boolean).join(' ').trim() || null;
}

function normalizeBrasilApi(data: any, cnpj: string) {
  return {
    cnpj,
    cnae_principal: data.cnae_fiscal?.toString() || null,
    cnae_descricao: data.cnae_fiscal_descricao || null,
    nome_fantasia: data.nome_fantasia || null,
    razao_social: data.razao_social || null,
    endereco: buildAddress(data.descricao_tipo_de_logradouro, data.logradouro, data.numero, data.complemento),
    bairro: data.bairro || null,
    cep: typeof data.cep === 'string' ? onlyDigits(data.cep) : null,
    situacao_cadastral: data.descricao_situacao_cadastral || null,
    responsavel_nome: Array.isArray(data.qsa)
      ? data.qsa.find((item: { nome_socio?: string | null }) => item?.nome_socio)?.nome_socio || null
      : null,
    telefone: buildAddress(data.ddd_telefone_1, data.ddd_telefone_2),
    email: data.email || null,
    municipio: data.municipio || null,
    uf: data.uf || null,
    data_abertura: data.data_inicio_atividade || null,
    source: 'brasilapi',
  };
}

function normalizeMinhaReceita(data: any, cnpj: string) {
  return {
    cnpj,
    cnae_principal: data.cnae_fiscal?.toString() || data.cnae?.toString() || null,
    cnae_descricao: data.cnae_fiscal_descricao || data.cnae_descricao || null,
    nome_fantasia: data.nome_fantasia || null,
    razao_social: data.razao_social || null,
    endereco: buildAddress(data.descricao_tipo_de_logradouro, data.logradouro, data.numero, data.complemento),
    bairro: data.bairro || null,
    cep: typeof data.cep === 'string' ? onlyDigits(data.cep) : null,
    situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || null,
    responsavel_nome: Array.isArray(data.qsa)
      ? data.qsa.find((item: { nome_socio?: string | null }) => item?.nome_socio)?.nome_socio || null
      : null,
    telefone: buildAddress(data.ddd_telefone_1, data.ddd_telefone_2),
    email: data.email || null,
    municipio: data.municipio || null,
    uf: data.uf || null,
    data_abertura: data.data_inicio_atividade || null,
    source: 'minhareceita',
  };
}

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
    const endereco = [
      data.descricao_tipo_de_logradouro,
      data.logradouro,
      data.numero,
      data.complemento,
    ].filter(Boolean).join(' ').trim() || null;
    const bairro = data.bairro || null;
    const cep = typeof data.cep === 'string' ? data.cep.replace(/\D/g, '') : null;
    const situacaoCadastral = data.descricao_situacao_cadastral || null;
    const responsavelNome = Array.isArray(data.qsa)
      ? data.qsa.find((item: { nome_socio?: string | null }) => item?.nome_socio)?.nome_socio || null
      : null;

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
        cnpj: cleanCnpj,
        cnae_principal: cnaePrincipal,
        cnae_descricao: cnaeDescricao,
        nome_fantasia: nomeFantasia,
        razao_social: razaoSocial,
        endereco,
        bairro,
        cep,
        situacao_cadastral: situacaoCadastral,
        responsavel_nome: responsavelNome,
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