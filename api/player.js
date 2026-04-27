const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  if (req.method === 'POST') {
    const { id, name, faction_id, telegram_id } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await sb.from('players')
      .upsert({
        id,
        name,
        faction_id: faction_id || null,
        telegram_id: telegram_id || null,
        ip_address: ip,
        score: 0,
        blocked: false
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ player: data });
  }

  if (req.method === 'PUT') {
    const { id, score } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { data, error } = await sb.from('players')
      .update({ score, ip_address: ip })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ player: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
