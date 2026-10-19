// Instead of: const authHeader = req.headers.authorization;
const token = getCookie(req, 'sb-access-token');
if (!token) {
  return res.status(401).json({ error: "Non autorisé. Jeton manquant." });
}
// Rest of your delete logic remains identical...
```[cite: 2]

---

### Step 3: Simplify `index.html` (Frontend)
Because browsers automatically attach cookies to same-origin requests, you no longer need to manage `window.userSession` or manually pass `Authorization` headers in your `fetch` calls.

1. **Remove `window.userSession` tracking completely.**
2. **Update the login/logout functions:**

```javascript
async function login() {
    const t = translations[currentLang];
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
    });

    const result = await response.json();
    if (!response.ok) {
        alert(result.error || t.loginError);
        return;
    }

    alert(t.loginSuccess);
    location.reload(); // Reloads page to reflect logged-in cookie state
}

async function logout() {
    await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    });
    location.reload();
}