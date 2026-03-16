import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get webhook ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const webhookId = pathParts[pathParts.length - 1];

    if (!webhookId || webhookId === "webhook-receiver") {
      return new Response(
        JSON.stringify({ error: "Webhook ID required. Use /webhook-receiver/{webhook_id}" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the webhook config
    const { data: webhook, error: webhookError } = await supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhookId)
      .eq("ativo", true)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: "Webhook not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: validate secret
    const secretHeader = req.headers.get("x-webhook-secret");
    if (webhook.secret_key && secretHeader && secretHeader !== webhook.secret_key) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the incoming payload
    let payload = {};
    try {
      payload = await req.json();
    } catch {
      payload = { raw: await req.text() };
    }

    const tempoResposta = Date.now() - startTime;

    // Log the event
    await supabase.from("webhook_eventos").insert({
      webhook_id: webhook.id,
      webhook_nome: webhook.nome,
      evento: webhook.evento,
      payload,
      status: "sucesso",
      status_code: 200,
      tempo_resposta: tempoResposta,
    });

    // Update webhook stats
    await supabase
      .from("webhooks")
      .update({
        total_eventos: webhook.total_eventos + 1,
        eventos_sucesso: webhook.eventos_sucesso + 1,
        ultima_execucao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhook.id);

    // Process event based on type
    if (webhook.evento === "lead_whatsapp" || webhook.evento === "lead_criado") {
      const leadData = payload as Record<string, unknown>;
      if (leadData.name || leadData.nome) {
        await supabase.from("leads").insert({
          name: (leadData.name || leadData.nome) as string,
          phone: (leadData.phone || leadData.telefone || leadData.whatsapp) as string,
          email: (leadData.email) as string,
          description: (leadData.description || leadData.descricao || leadData.mensagem) as string,
          source: (leadData.source || leadData.origem || "WhatsApp") as string,
          status: "novo",
          link_imovel_interesse: (leadData.link_imovel || leadData.imovel_link) as string,
        });
      }
    }

    if (webhook.evento === "lead_status_alterado") {
      const data = payload as Record<string, unknown>;
      if (data.phone || data.telefone) {
        const phone = (data.phone || data.telefone) as string;
        await supabase.rpc("mover_lead_contato_inicial", { p_phone: phone });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook received successfully",
        webhook_id: webhook.id,
        evento: webhook.evento,
        tempo_resposta: tempoResposta,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const tempoResposta = Date.now() - startTime;
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        tempo_resposta: tempoResposta,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
