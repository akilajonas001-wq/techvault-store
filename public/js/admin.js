// Admin JS - Funções compartilhadas
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('techvault-token');
  const headers = { 'Authorization': 'Bearer ' + token, ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  return res.json();
}
