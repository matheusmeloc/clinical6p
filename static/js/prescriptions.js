// ===== RECEITAS / PRESCRIÇÕES =====
// CRUD completo de receitas médicas.

async function fetchPrescriptions() {
    try {
        const response = await apiFetch('/api/prescriptions');
        const prescriptions = await response.json();
        const tbody = document.getElementById('prescriptions-table-body');
        tbody.innerHTML = '';

        prescriptions.forEach(p => {
            const tr = document.createElement('tr');
            const dateObj = new Date(p.date);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="clickable-patient" onclick="openPatientInfo(${p.patient_id})" style="cursor:pointer;color:var(--primary);font-weight:500;">${p.patient_name}</span></td>
                <td>${p.professional_name}</td>
                <td>${p.medication_name}</td>
                <td>${p.certificate_type || '-'}</td>
                <td>
                    <i class="fas fa-edit action-btn" style="color: var(--primary); cursor: pointer; margin-right: 8px;" onclick='editPrescription(${JSON.stringify(p)})'></i>
                    <i class="fas fa-trash action-btn delete" onclick="deletePrescription(${p.id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching prescriptions:', e);
    }
}

async function openPrescriptionModal(prefill = null) {
    document.getElementById('prescription-modal-title').innerText = prefill ? 'Editar Receita' : 'Nova Receita';
    document.getElementById('prescription-id-field').value = prefill ? prefill.id : '';
    openModal('prescription-modal');

    try {
        const resPat = await apiFetch('/api/patients');
        const patients = await resPat.json();
        const patSelect = document.getElementById('presc-patient-select');
        patSelect.innerHTML = '<option value="">Selecione...</option>';
        patients.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            patSelect.appendChild(opt);
        });

        const resProf = await apiFetch('/api/professionals');
        const professionals = await resProf.json();
        const profSelect = document.getElementById('presc-professional-select');
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
            document.querySelector('#prescription-form [name="medication_name"]').value = prefill.medication_name || '';
            document.querySelector('#prescription-form [name="dosage"]').value = prefill.dosage || '';
            document.querySelector('#prescription-form [name="certificate_type"]').value = prefill.certificate_type || 'Sem Atestado';
            document.querySelector('#prescription-form [name="date"]').value = prefill.date || '';
        }
    } catch (e) {
        console.error('Error populating select for prescription:', e);
    }
}

function editPrescription(prescription) {
    openPrescriptionModal(prescription);
}

async function handlePrescriptionSubmit(event) {
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

    if (!data.date) delete data.date;

    const prescriptionId = document.getElementById('prescription-id-field').value;
    const isEdit = prescriptionId && prescriptionId !== '';
    const url = isEdit ? `/api/prescriptions/${prescriptionId}` : '/api/prescriptions';
    const method = isEdit ? 'PUT' : 'POST';
    delete data.prescription_id;

    try {
        const response = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal('prescription-modal');
            form.reset();
            document.getElementById('prescription-id-field').value = '';
            fetchPrescriptions();
        } else {
            const err = await response.json();
            alert('Erro ao salvar receita: ' + (err.detail || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Error saving prescription:', e);
    }
}

async function deletePrescription(id) {
    if (!confirm('Tem certeza que deseja remover esta receita?')) return;
    try {
        const response = await apiFetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
        if (response.ok) fetchPrescriptions();
    } catch (e) {
        console.error('Error deleting prescription:', e);
    }
}
