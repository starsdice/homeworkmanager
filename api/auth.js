import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { action, email, password } = req.body;

    // Action d'inscription
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return res.status(200).json({ message: "Inscription réussie", data });
    }

    // Action de connexion
    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Retourne la session (qui contient le token d'accès) au front-end
      return res.status(200).json({ session: data.session });
    }

    return res.status(400).json({ error: "Action non reconnue" });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}