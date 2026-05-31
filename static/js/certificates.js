// ===== ATESTADOS =====
// CRUD completo de atestados médicos.

async function fetchCertificates() {
    try {
        const response = await apiFetch('/api/certificates');
        const certificates = await response.json();
        const tbody = document.getElementById('certificates-table-body');
        tbody.innerHTML = '';

        certificates.forEach(c => {
            const tr = document.createElement('tr');
            const dateObj = new Date(c.date);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="clickable-patient" onclick="openPatientInfo(${c.patient_id})" style="cursor:pointer;color:var(--primary);font-weight:500;">${c.patient_name}</span></td>
                <td>${c.professional_name}</td>
                <td>${c.type}</td>
                <td>${c.duration_days || '-'}</td>
                <td>
                    <i class="fas fa-edit action-btn" style="color: var(--primary); cursor: pointer; margin-right: 8px;" onclick='editCertificate(${JSON.stringify(c)})'></i>
                    <i class="fas fa-trash action-btn delete" onclick="deleteCertificate(${c.id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching certificates:', e);
    }
}

async function openCertificateModal(prefill = null) {
    document.getElementById('certificate-modal-title').innerText = prefill ? 'Editar Atestado' : 'Novo Atestado';
    document.getElementById('certificate-id-field').value = prefill ? prefill.id : '';
    openModal('certificate-modal');

    try {
        const resPat = await apiFetch('/api/patients');
        const patients = await resPat.json();
        const patSelect = document.getElementById('cert-patient-select');
        patSelect.innerHTML = '<option value="">Selecione...</option>';
        patients.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            patSelect.appendChild(opt);
        });

        const resProf = await apiFetch('/api/professionals');
        const professionals = await resProf.json();
        const profSelect = document.getElementById('cert-professional-select');
        profSelect.innerHTML = '<option value="">Selecione...</option>';
        professionals.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name + ' (' + p.role + ')';
            profSelect.appendChild(opt);
        });

        if (prefill) {
            patSelect.value = prefill.patient_id;
            profSelect.value = prefill.professional_id;
            document.querySelector('#certificate-form [name="type"]').value = prefill.type || 'Médico';
            document.querySelector('#certificate-form [name="duration_days"]').value = prefill.duration_days || '';
            document.querySelector('#certificate-form [name="date"]').value = prefill.date || '';
            document.querySelector('#certificate-form [name="description"]').value = prefill.description || '';
        }
    } catch (e) {
        console.error('Error populating select for certificates:', e);
    }
}

function editCertificate(cert) {
    openCertificateModal(cert);
}

async function handleCertificateSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (!data.patient_id || !data.professional_id) {
        alert('Erro: Selecione Paciente e Profissional!');
        return;
    }

    data.patient_id = parseInt(data.patient_id);
    data.professional_id = parseInt(data.professional_id);
    if (data.duration_days) data.duration_days = parseInt(data.duration_days);

    const certId = document.getElementById('certificate-id-field').value;
    const isEdit = certId && certId !== '';
    const url = isEdit ? `/api/certificates/${certId}` : '/api/certificates';
    const method = isEdit ? 'PUT' : 'POST';
    delete data.certificate_id;

    try {
        const response = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal('certificate-modal');
            form.reset();
            fetchCertificates();
        } else {
            const err = await response.json();
            alert('Erro ao salvar atestado: ' + (err.detail || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Error saving certificate:', e);
    }
}

async function deleteCertificate(id) {
    if (!confirm('Tem certeza que deseja remover este atestado?')) return;
    try {
        const response = await apiFetch(`/api/certificates/${id}`, { method: 'DELETE' });
        if (response.ok) fetchCertificates();
    } catch (e) {
        console.error('Error deleting certificate:', e);
    }
}
