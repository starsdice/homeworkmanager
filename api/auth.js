import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, email, password } = req.method === 'POST' ? req.body : {};
    const queryAction = req.query.action;
    const currentAction = action || queryAction;

    // 1. Check current session
    if (req.method === 'GET' || currentAction === 'session') {
      const token = getCookie(req, 'sb-access-token');
      if (!token) return res.status(401).json({ error: "Not logged in" });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: "Invalid session" });

      return res.status(200).json({ user });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // 2. Signup
    if (currentAction === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return res.status(200).json({ message: "Inscription réussie", data });
    }

    // 3. Login (Sets HttpOnly Cookie)
    if (currentAction === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const cookieOptions = [
        `sb-access-token=${data.session.access_token}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        `Max-Age=${60 * 60 * 24 * 7}`, // 1 week
        process.env.NODE_ENV === 'production' ? 'Secure' : ''
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', cookieOptions);
      return res.status(200).json({ user: data.user });
    }

    // 4. Logout (Clears Cookie)
    if (currentAction === 'logout') {
      res.setHeader('Set-Cookie', 'sb-access-token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
      return res.status(200).json({ message: "Déconnexion réussie" });
    }

    return res.status(400).json({ error: "Action non reconnue" });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}