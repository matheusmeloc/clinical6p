// ===== PROFISSIONAIS / FUNCIONÁRIOS =====
// CRUD completo de profissionais.

async function fetchProfessionals() {
    try {
        const response = await apiFetch('/api/professionals');
        const professionals = await response.json();
        const tbody = document.getElementById('professionals-table-body');
        tbody.innerHTML = '';

        professionals.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.name}</td>
                <td>${p.role}</td>
                <td>${p.professional_register || '-'}</td>
                <td>${p.phone || '-'}</td>
                <td><span class="status-badge status-${getStatusClass(p.status)}">${p.status === 'Active' ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <i class="fas fa-edit action-btn" style="color: var(--primary); cursor: pointer; margin-right: 8px;" onclick='editProfessional(${JSON.stringify(p)})'></i>
                    <i class="fas fa-trash action-btn delete" onclick="deleteProfessional(${p.id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching professionals:', e);
    }
}

function editProfessional(professional) {
    openProfessionalModal(professional);
}

function openProfessionalModal(prefill = null) {
    const form = document.getElementById('professional-form');
    document.getElementById('professional-modal-title').innerText = prefill ? 'Editar Funcionário' : 'Novo Funcionário';
    document.getElementById('professional-id-field').value = prefill ? prefill.id : '';
    openModal('professional-modal');

    if (prefill) {
        form.setAttribute('data-old-email', prefill.email || '');
        form.querySelector('[name="name"]').value = prefill.name || '';
        form.querySelector('[name="role"]').value = prefill.role || '';
        form.querySelector('[name="status"]').value = prefill.status || 'Active';
        form.querySelector('[name="email"]').value = prefill.email || '';
        form.querySelector('[name="phone"]').value = prefill.phone || '';
        form.querySelector('[name="professional_register"]').value = prefill.professional_register || '';
        form.querySelector('[name="specialty"]').value = prefill.specialty || '';
        updateRegisterLabel();
    } else {
        form.removeAttribute('data-old-email');
    }
}

function updateRegisterLabel() {
    const role = document.getElementById('prof-role-select').value;
    const label = document.getElementById('prof-register-label');

    if (role === 'Psicólogo') label.innerText = 'CRP';
    else if (role === 'Dentista') label.innerText = 'CRO';
    else if (role === 'Nutricionista') label.innerText = 'CRN';
    else label.innerText = 'Registro Profissional';
}

async function handleProfessionalSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const professionalId = document.getElementById('professional-id-field').value;
    const isEdit = professionalId && professionalId !== '';
    const url = isEdit ? `/api/professionals/${professionalId}` : '/api/professionals';
    const method = isEdit ? 'PUT' : 'POST';
    delete data.professional_id;

    try {
        const response = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Atualiza localStorage se o e-mail do usuário atual mudou
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const oldEmail = form.getAttribute('data-old-email');
            if (isEdit && oldEmail && currentUser.email === oldEmail && data.email !== oldEmail) {
                currentUser.email = data.email;
                localStorage.setItem('user', JSON.stringify(currentUser));

                const profile = localStorage.getItem('profile_' + oldEmail);
                if (profile) {
                    localStorage.setItem('profile_' + data.email, profile);
                    localStorage.removeItem('profile_' + oldEmail);
                }
            }

            closeModal('professional-modal');
            form.reset();
            form.removeAttribute('data-old-email');
            document.getElementById('professional-id-field').value = '';
            fetchProfessionals();
        } else {
            const err = await response.json();
            alert('Erro ao salvar funcionário: ' + (err.detail || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Error saving professional:', e);
    }
}

async function deleteProfessional(id) {
    if (!confirm('Tem certeza que deseja remover este funcionário?')) return;
    try {
        const response = await apiFetch(`/api/professionals/${id}`, { method: 'DELETE' });
        if (response.ok) fetchProfessionals();
    } catch (e) {
        console.error('Error deleting professional:', e);
    }
}
