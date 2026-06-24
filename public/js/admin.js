// Admin JS - Funções compartilhadas
async function adminFetch(url) {
  const token = localStorage.getItem('techvault-token');
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return res.json();
}
