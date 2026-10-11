import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    let userClient = supabase;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      // Crée un client lié à la session de l'utilisateur pour respecter les règles RLS
      userClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
    }
    // GET: Fetch all homeworks
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('homeworks').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // POST: Add a new homework
    if (req.method === 'POST') {
      const { title, subject, due_date } = req.body;
      const { data, error } = await supabase
        .from('homeworks')
        .insert([{ title, subject, due_date, completed: false }])
        .select();
      
      if (error) throw error;
      return res.status(201).json(data[0]);
    }

    // DELETE: Remove a homework by ID
    if (req.method === 'DELETE') {
      const { id } = req.query; // Récupère l'ID depuis l'URL (ex: /api/homeworks?id=5)
      const { error } = await supabase.from('homeworks').delete().eq('id', id);
      
      if (error) throw error;
      return res.status(200).json({ message: "Homework deleted successfully" });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}