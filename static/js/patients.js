// ===== PACIENTES =====
// CRUD completo, card rápido de informações e prontuário (perfil detalhado).

// Armazena o ID do paciente exibido no card flutuante
let currentInfoPatientId = null;

// ----- FUNÇÕES AUXILIARES -----

function _patientToDict(p) {
    return {
        id: p.id,
        name: p.name,
        cpf: p.cpf,
        birth_date: p.birth_date,
        gender: p.gender,
        marital_status: p.marital_status,
        profession: p.profession,
        phone: p.phone,
        email: p.email,
        address_cep: p.address_cep,
        address_street: p.address_street,
        address_number: p.address_number,
        address_complement: p.address_complement,
        address_neighborhood: p.address_neighborhood,
        address_city: p.address_city,
        address_state: p.address_state,
        care_modality: p.care_modality,
        attendance_type: p.attendance_type,
        insurance_plan: p.insurance_plan,
        insurance_number: p.insurance_number,
        insurance_expiration_date: p.insurance_expiration_date,
        emergency_contact_name: p.emergency_contact_name,
        emergency_contact_phone: p.emergency_contact_phone,
        emergency_contact_relation: p.emergency_contact_relation,
        consent_terms_accepted: p.consent_terms_accepted,
        professional_id: p.professional_id,
        professional_name: p.professional_name,
        status: p.status,
        observations: p.observations,
        created_at: p.created_at,
    };
}

// ----- LISTAGEM -----

async function fetchPatients() {
    try {
        const response = await apiFetch('/api/patients');
        const patients = await response.json();
        const tbody = document.getElementById('patients-table-body');
        tbody.innerHTML = '';

        patients.forEach(patient => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="clickable-patient" onclick="openPatientInfo(${patient.id})" style="cursor:pointer;color:var(--primary);font-weight:500;">${patient.name}</td>
                <td>${patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                <td>${patient.cpf || '-'}</td>
                <td>${patient.phone || '-'}</td>
                <td>${patient.professional_name || '<span class="text-muted">-</span>'}</td>
                <td><span class="status-badge status-${getStatusClass(patient.status)}">${patient.status === 'Active' ? 'Ativo' : patient.status}</span></td>
                <td>
                    <i class="fas fa-edit action-btn" style="color: var(--primary); cursor: pointer; margin-right: 8px;" onclick='editPatient(${JSON.stringify(patient)})'></i>
                    <i class="fas fa-trash action-btn delete" onclick="deletePatient(${patient.id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching patients:', e);
    }
}

// ----- MODAL DE EDIÇÃO/CRIAÇÃO -----

function editPatient(patient) {
    openPatientModal(patient);
}

async function openPatientModal(prefill = null) {
    document.getElementById('patient-modal-title').innerText = prefill ? 'Editar Paciente' : 'Novo Paciente';
    document.getElementById('patient-id-field').value = prefill ? prefill.id : '';
    openModal('patient-modal');

    try {
        const res = await apiFetch('/api/professionals');
        const professionals = await res.json();
        const select = document.getElementById('patient-professional-select');
        select.innerHTML = '<option value="">Nenhum (sem vínculo)</option>';
        professionals.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name + ' (' + p.role + ')';
            select.appendChild(opt);
        });

        if (prefill) {
            const form = document.getElementById('patient-form');
            form.querySelector('[name="name"]').value = prefill.name || '';
            form.querySelector('[name="birth_date"]').value = prefill.birth_date || '';
            form.querySelector('[name="cpf"]').value = prefill.cpf || '';
            form.querySelector('[name="email"]').value = prefill.email || '';
            form.querySelector('[name="phone"]').value = prefill.phone || '';
            form.querySelector('[name="gender"]').value = prefill.gender || '';
            form.querySelector('[name="marital_status"]').value = prefill.marital_status || '';
            form.querySelector('[name="profession"]').value = prefill.profession || '';

            form.querySelector('[name="address_cep"]').value = prefill.address_cep || '';
            form.querySelector('[name="address_street"]').value = prefill.address_street || '';
            form.querySelector('[name="address_number"]').value = prefill.address_number || '';
            form.querySelector('[name="address_complement"]').value = prefill.address_complement || '';
            form.querySelector('[name="address_neighborhood"]').value = prefill.address_neighborhood || '';
            form.querySelector('[name="address_city"]').value = prefill.address_city || '';
            form.querySelector('[name="address_state"]').value = prefill.address_state || '';

            const attType = prefill.attendance_type || 'Particular';
            form.querySelector('[name="attendance_type"]').value = attType;
            form.querySelector('[name="insurance_plan"]').value = prefill.insurance_plan || '';
            form.querySelector('[name="insurance_number"]').value = prefill.insurance_number || '';
            form.querySelector('[name="insurance_expiration_date"]').value = prefill.insurance_expiration_date || '';

            form.querySelector('[name="emergency_contact_name"]').value = prefill.emergency_contact_name || '';
            form.querySelector('[name="emergency_contact_phone"]').value = prefill.emergency_contact_phone || '';
            form.querySelector('[name="emergency_contact_relation"]').value = prefill.emergency_contact_relation || '';
            form.querySelector('[name="consent_terms_accepted"]').checked = !!prefill.consent_terms_accepted;

            form.querySelector('[name="observations"]').value = prefill.observations || '';
            if (prefill.professional_id) select.value = prefill.professional_id;

            if (typeof toggleInsuranceFields === 'function') toggleInsuranceFields();
        }
    } catch (e) {
        console.error('Error loading professionals:', e);
    }
}

async function handlePatientSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.consent_terms_accepted = formData.get('consent_terms_accepted') === 'true';

    if (!data.birth_date) data.birth_date = null;
    if (!data.insurance_expiration_date) data.insurance_expiration_date = null;

    for (let key in data) {
        if (data[key] === '') data[key] = null;
    }

    if (data.professional_id) data.professional_id = parseInt(data.professional_id);
    else data.professional_id = null;

    const patientId = document.getElementById('patient-id-field').value;
    const isEdit = patientId && patientId !== '';
    const url = isEdit ? `/api/patients/${patientId}` : '/api/patients';
    const method = isEdit ? 'PUT' : 'POST';
    delete data.patient_id;

    try {
        const response = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal('patient-modal');
            form.reset();
            document.getElementById('patient-id-field').value = '';
            fetchPatients();
            showToast('Paciente salvo com sucesso!');
        } else {
            const err = await response.json();
            alert('Erro ao salvar paciente: ' + (err.detail || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Error saving patient:', e);
    }
}

async function deletePatient(id) {
    if (!confirm('Tem certeza que deseja desativar este paciente?')) return;
    try {
        const response = await apiFetch(`/api/patients/${id}`, { method: 'DELETE' });
        if (response.ok) fetchPatients();
    } catch (e) {
        console.error('Error deleting patient:', e);
    }
}

// ----- CARD RÁPIDO DE INFORMAÇÕES -----

async function openPatientInfo(patientId) {
    currentInfoPatientId = patientId;
    const modal = document.getElementById('patient-info-modal');

    document.getElementById('infocard-name').innerText = 'Carregando...';
    document.getElementById('infocard-phone').innerText = '--';
    document.getElementById('infocard-birth').innerText = '--';
    document.getElementById('infocard-cpf').innerText = '--';
    document.getElementById('infocard-observations').innerText = 'Carregando...';
    document.getElementById('infocard-avatar').innerHTML = '--';

    modal.classList.add('active');

    try {
        const response = await apiFetch(`/api/patients/${patientId}`);
        if (!response.ok) throw new Error('Falha ao carregar paciente');
        const patient = await response.json();

        document.getElementById('infocard-name').innerText = patient.name;
        document.getElementById('infocard-phone').innerText = patient.phone || 'Sem telefone';

        const birthStr = patient.birth_date
            ? new Date(patient.birth_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : 'Não informada';
        document.getElementById('infocard-birth').innerText = birthStr;
        document.getElementById('infocard-cpf').innerText = patient.cpf || 'Sem CPF';
        document.getElementById('infocard-observations').innerText = patient.observations || 'Nenhuma observação registrada.';

        const statusPill = document.getElementById('infocard-status-pill');
        const statusText = document.getElementById('infocard-status-text');
        const isAtivo = patient.status === 'Active' || patient.status === 'Ativo';
        statusText.innerText = isAtivo ? 'Ativo' : 'Inativo';
        statusPill.style.background = isAtivo ? 'var(--color-success-bg)' : 'var(--color-danger-bg)';
        statusPill.style.color = isAtivo ? 'var(--color-success)' : 'var(--color-danger)';

        const avatar = document.getElementById('infocard-avatar');
        if (patient.photo) {
            avatar.innerHTML = `<img src="${patient.photo}" alt="${patient.name}">`;
            avatar.style.background = 'transparent';
            avatar.style.border = 'none';
        } else {
            avatar.innerText = patient.name.substring(0, 2).toUpperCase();
            avatar.style.background = 'var(--bg-surface)';
            avatar.style.border = '4px solid var(--bg-surface)';
        }
    } catch (e) {
        console.error('Erro ao abrir card de informações:', e);
        document.getElementById('infocard-name').innerText = 'Erro ao carregar';
    }
}

function closePatientInfo() {
    document.getElementById('patient-info-modal').classList.remove('active');
    currentInfoPatientId = null;
}

function viewFullProfileFromInfo() {
    if (currentInfoPatientId) {
        const id = currentInfoPatientId;
        closePatientInfo();
        openPatientProfile(id);
    }
}

// ----- PRONTUÁRIO (PERFIL COMPLETO) -----

async function openPatientProfileByName(name) {
    try {
        const res = await apiFetch('/api/patients');
        const patients = await res.json();
        const patient = patients.find(p => p.name === name);
        if (patient) {
            openPatientProfile(patient.id);
        } else {
            alert('Paciente não encontrado!');
        }
    } catch (e) {
        console.error('Error finding patient:', e);
        alert('Erro ao achar paciente.');
    }
}

async function openPatientProfile(id) {
    try {
        const response = await apiFetch(`/api/patients/${id}`);
        const patient = await response.json();

        document.getElementById('profile-patient-id').value = patient.id;
        document.getElementById('profile-name-display').textContent = patient.name;
        document.getElementById('profile-age-display').textContent = patient.age ? `${patient.age} anos` : '-- anos';
        document.getElementById('profile-initials').textContent = patient.name.substring(0, 2).toUpperCase();
        document.getElementById('profile-status-display').textContent = patient.status || 'Ativo';
        document.getElementById('profile-modality-display').textContent = patient.care_modality || 'Presencial';
        document.getElementById('profile-insurance-display').textContent = patient.insurance_plan || 'Particular';
        document.getElementById('profile-contact-display').textContent = patient.phone || '--';
        document.getElementById('profile-notes').value = patient.observations || '';

        try {
            let msgUrl = '/api/patient-messages';
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role !== 'admin') {
                    msgUrl += `?professional_id=${user.id}`;
                }
            }
            const msgResp = await apiFetch(msgUrl);
            const allMsgs = await msgResp.json();
            const patMsgs = allMsgs.filter(m => m.patient_id === id);
            const listEl = document.getElementById('profile-messages-list');
            if (patMsgs.length === 0) {
                listEl.innerHTML = '<p class="text-muted text-sm" style="padding:1rem;">Nenhuma mensagem recebida deste paciente.</p>';
            } else {
                listEl.innerHTML = patMsgs.map(m => {
                    const d = new Date(m.created_at);
                    const dStr = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return `
                    <div style="background:var(--bg-body); border:1px solid var(--border-subtle); padding:1rem; border-radius:8px; margin-bottom:1rem;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <strong style="color:var(--primary); font-size:0.9rem;">${dStr}</strong>
                            ${m.is_read
                            ? '<span class="text-xs text-muted"><i class="fas fa-check-double"></i> Lida</span>'
                            : '<span class="text-xs text-primary" style="font-weight:bold"><i class="fas fa-circle"></i> Nova</span>'}
                        </div>
                        <p style="font-size:0.95rem; white-space:pre-wrap; line-height:1.5; color:var(--text-main); margin:0;">${m.message}</p>
                    </div>
                    `;
                }).join('');
            }
        } catch (e) {
            console.error('Erro ao carregar mensagens para card:', e);
        }

        openModal('patient-profile-modal');
    } catch (e) {
        console.error('Error loading patient profile:', e);
        alert('Erro ao carregar perfil do paciente.');
    }
}

async function savePatientNotes(event) {
    event.preventDefault();
    const id = document.getElementById('profile-patient-id').value;
    const notes = document.getElementById('profile-notes').value;

    try {
        const getResp = await apiFetch(`/api/patients/${id}`);
        const patient = await getResp.json();

        const updateResp = await apiFetch(`/api/patients/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: patient.name, observations: notes })
        });

        if (updateResp.ok) {
            alert('Anotações salvas com sucesso!');
        } else {
            alert('Erro ao salvar anotações.');
        }
    } catch (e) {
        console.error('Error saving notes:', e);
        alert('Erro ao salvar.');
    }
}
