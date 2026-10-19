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

    // 1. Signup
    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return res.status(200).json({ message: "Inscription réussie", data });
    }

    // 2. Login (Sets HttpOnly Cookie)
    if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Set secure HttpOnly cookie containing the access token
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

    // 3. Logout (Clears Cookie)
    if (action === 'logout') {
      const clearedCookie = 'sb-access-token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0';
      res.setHeader('Set-Cookie', clearedCookie);
      return res.status(200).json({ message: "Déconnexion réussie" });
    }

    return res.status(400).json({ error: "Action non reconnue" });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
```[cite: 1]

---

### Step 2: Update Protected API Routes to Read Cookies
Instead of looking for an `Authorization: Bearer` header, your other API routes (`api/homeworks.js` and `api/delete-account.js`) should parse the incoming cookie header.

Add a simple helper at the top of your API files to extract the cookie:
```javascript
function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=');
      return [key, decodeURIComponent(v.join('='))];
    })
  );
  return cookies[name] || null;
}