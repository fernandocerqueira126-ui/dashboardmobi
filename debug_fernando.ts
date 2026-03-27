
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFernando() {
  console.log("Checking leads for Fernando...");
  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .ilike('name', '%Fernando%');

  if (leadError) console.error(leadError);
  console.log("Leads found:", leads);

  if (leads && leads.length > 0) {
    const phone = leads[0].phone;
    console.log(`Searching webhooks for phone: ${phone}`);
    const { data: events, error: eventError } = await supabase
      .from('webhook_eventos')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventError) console.error(eventError);
    
    const matching = (events || []).filter(e => {
        const p = e.payload as any;
        return p?.phone === phone || p?.sender_phone === phone || JSON.stringify(p).includes(phone);
    });

    console.log(`Found ${matching.length} matching events.`);
    if (matching.length > 0) {
        console.log("Sample event payload:", JSON.stringify(matching[0].payload, null, 2));
    }
  }
}

checkFernando();
