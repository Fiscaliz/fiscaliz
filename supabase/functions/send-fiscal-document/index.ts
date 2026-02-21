import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendDocumentRequest {
  email: string;
  documentId: string;
  documentType: string;
  establishmentName: string;
  fiscalName: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado. Configure a API key do Resend." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);
    const { email, documentId, documentType, establishmentName, fiscalName }: SendDocumentRequest = await req.json();

    if (!email || !documentId || !documentType) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending fiscal document to ${email}`, { documentId, documentType, establishmentName });

    const appUrl = Deno.env.get("APP_URL") || "https://fiscaliz-smart-app.lovable.app";
    const documentLink = `${appUrl}/documento/${documentId}`;

    const emailResponse = await resend.emails.send({
      from: "Fiscaliz <noreply@resend.dev>",
      to: [email],
      subject: `${documentType} - Vigilância Sanitária de Goiânia`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a365d; margin: 0;">PREFEITURA DE GOIÂNIA</h1>
            <h2 style="color: #2d3748; margin: 5px 0; font-size: 16px;">SECRETARIA MUNICIPAL DE SAÚDE</h2>
            <p style="color: #718096; margin: 5px 0; font-size: 14px;">Diretoria de Vigilância Sanitária e Ambiental</p>
          </div>
          
          <div style="background: #f7fafc; border-left: 4px solid #3182ce; padding: 20px; margin: 20px 0;">
            <h2 style="color: #2b6cb0; margin: 0 0 10px 0;">${documentType}</h2>
            <p style="margin: 5px 0;"><strong>Estabelecimento:</strong> ${establishmentName}</p>
            <p style="margin: 5px 0;"><strong>Fiscal Responsável:</strong> ${fiscalName}</p>
          </div>
          
          <div style="background: #fffbeb; border: 1px solid #f6e05e; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #744210; margin: 0;">
              <strong>⚠️ Atenção:</strong> Este é um documento oficial da Vigilância Sanitária. 
              Por favor, leia atentamente e tome as providências necessárias dentro do prazo estabelecido.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentLink}" 
               style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              📄 Visualizar Documento Completo
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center; color: #718096; font-size: 12px;">
            <p>Av. Universitária esq. c/ 1ª Avenida, s/nº - Setor Universitário</p>
            <p>CEP: 74605-010 - Goiânia/GO</p>
            <p>Email: visagoianiaalimentos@gmail.com</p>
            <p style="margin-top: 15px;">
              <em>Documento gerado por <strong>FISCALIZ®</strong></em>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending fiscal document email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);