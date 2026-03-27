
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data, error } = await supabase
    .from('webhook_eventos')
    .select('*')
    .limit(10)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log("Recent webhook_eventos payloads:");
  data.forEach((row, i) => {
    console.log(`Row ${i} [${row.webhook_nome}]:`, JSON.stringify(row.payload, null, 2));
  });
}

checkData();
