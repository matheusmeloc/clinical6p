// ===== MENSAGENS DE PACIENTES =====
// Listagem, leitura e badge de não lidas.

async function fetchMessages() {
    try {
        let url = '/api/patient-messages';
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role !== 'admin') {
                url += `?professional_id=${user.id}`;
            }
        }
        const response = await apiFetch(url);
        const messages = await response.json();
        const tbody = document.getElementById('messages-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">Nenhuma mensagem encontrada.</td></tr>';
            return;
        }

        messages.forEach(msg => {
            const tr = document.createElement('tr');
            const dateObj = new Date(msg.created_at);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const isReadHTML = msg.is_read
                ? '<span class="status-badge status-confirmed">Lida</span>'
                : '<span class="status-badge status-pending">Nova</span>';

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="clickable-patient" onclick="openPatientInfo(${msg.patient_id})" style="cursor:pointer;color:var(--primary);font-weight:500;">${msg.patient_name}</span></td>
                <td>${msg.message.length > 60 ? msg.message.substring(0, 60) + '...' : msg.message}</td>
                <td id="msg-status-${msg.id}">${isReadHTML}</td>
                <td>
                    ${!msg.is_read
                    ? `<i class="fas fa-check action-btn" style="color: var(--primary); cursor: pointer;" title="Marcar como lida" onclick="markMessageRead(${msg.id})"></i>`
                    : '<i class="fas fa-check-double action-btn" style="color: var(--text-muted); cursor: not-allowed;" title="Já lida"></i>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching patient messages:', e);
    }
}

async function markMessageRead(id) {
    try {
        const response = await apiFetch(`/api/patient-messages/${id}/read`, { method: 'PUT' });
        if (response.ok) fetchMessages();
    } catch (e) {
        console.error('Error marking message as read:', e);
    }
}

async function updateUnreadBadge() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user.role === 'admin') return;

    try {
        const res = await apiFetch('/api/professionals');
        const professionals = await res.json();
        const prof = professionals.find(p => p.email === user.email);

        if (prof) {
            const badgeRes = await apiFetch(`/api/patient-messages/unread?professional_id=${prof.id}`);
            const badgeData = await badgeRes.json();

            const badgeEl = document.getElementById('unread-badge');
            if (badgeData.count > 0) {
                badgeEl.innerText = badgeData.count;
                badgeEl.style.display = 'block';
            } else {
                badgeEl.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Error fetching unread messages:', e);
    }
}
