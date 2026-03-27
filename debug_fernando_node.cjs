
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findFernando() {
    console.log("Searching for Fernando in leads...");
    const { data: leads, error } = await supabase.from('leads').select('*').ilike('name', '%Fernando%');
    if (error) {
        console.error(error);
        return;
    }
    console.log("Leads found:", leads.map(l => ({ name: l.name, phone: l.phone })));

    if (leads.length > 0) {
        const phone = leads[0].phone;
        console.log(`Searching events for phone: ${phone}`);
        const { data: events, error: evError } = await supabase.from('webhook_eventos').select('*').order('created_at', { descending: true }).limit(50);
        if (evError) {
            console.error(evError);
            return;
        }
        
        const matching = events.filter(e => JSON.stringify(e.payload).includes(phone));
        console.log(`Found ${matching.length} matching events in recent 50.`);
        if (matching.length > 0) {
            console.log("First match payload:", JSON.stringify(matching[0].payload, null, 2));
        } else {
            console.log("No match in recent 50. Dumping recent 5 payloads:");
            events.slice(0, 5).forEach(e => console.log(JSON.stringify(e.payload, null, 2)));
        }
    }
}

findFernando();
