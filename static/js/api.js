// ===== API HELPER =====
// Função central para todas as chamadas HTTP autenticadas.
// Injeta automaticamente o Bearer token do localStorage e redireciona
// para /login caso o servidor retorne 401 (token inválido/expirado).

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return response;
}
