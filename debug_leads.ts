
import { createClient } from '@supabase/supabase-js'

// No dotenv, just use process.env (Vite dev server might have them, but node script won't)
// I'll grab them from the .env file if I can read it
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFernando() {
    const { data: leads } = await supabase.from('leads').select('*').ilike('name', '%Fernando%');
    console.log("LEADS_FOUND:", JSON.stringify(leads));
}

findFernando();
