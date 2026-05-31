// ===== AGENDAMENTOS =====
// CRUD completo de agendamentos.

async function fetchAppointments() {
    try {
        const response = await apiFetch('/api/appointments');
        const appointments = await response.json();
        const tbody = document.getElementById('appointments-table-body');
        tbody.innerHTML = '';

        appointments.forEach(appt => {
            const tr = document.createElement('tr');
            const dateObj = new Date(appt.date);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${appt.time.substring(0, 5)}</td>
                <td><span class="clickable-patient" onclick="openPatientInfo(${appt.patient_id})" style="cursor:pointer;color:var(--primary);font-weight:500;">${appt.patient_name}</span></td>
                <td>${appt.professional_name}</td>
                <td><span class="status-badge status-${getStatusClass(appt.status)}">${appt.status}</span></td>
                <td>
                    <i class="fas fa-edit action-btn" style="color: var(--primary); cursor: pointer; margin-right: 8px;" onclick='editAppointment(${JSON.stringify(appt)})'></i>
                    <i class="fas fa-trash action-btn delete" onclick="deleteAppointment(${appt.id})"></i>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error fetching appointments:', e);
    }
}

function editAppointment(appt) {
    openAppointmentModal(appt);
}

async function openAppointmentModal(prefill = null) {
    document.getElementById('appointment-modal-title').innerText = prefill ? 'Editar Agendamento' : 'Novo Agendamento';
    document.getElementById('appointment-id-field').value = prefill ? prefill.id : '';
    openModal('appointment-modal');

    try {
        const resPat = await apiFetch('/api/patients');
        const patients = await resPat.json();
        const patSelect = document.getElementById('appt-patient-select');
        patSelect.innerHTML = '<option value="">Selecione...</option>';
        patients.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            patSelect.appendChild(opt);
        });

        const resProf = await apiFetch('/api/professionals');
        const professionals = await resProf.json();
        const profSelect = document.getElementById('appt-professional-select');
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
            const form = document.getElementById('appointment-form');
            if (prefill.date) form.querySelector('[name="date"]').value = prefill.date;
            if (prefill.time) form.querySelector('[name="time"]').value = prefill.time.substring(0, 5);
            if (prefill.status) form.querySelector('[name="status"]').value = prefill.status;
            if (prefill.observations) form.querySelector('[name="observations"]').value = prefill.observations;
            if (prefill.certificate_type) form.querySelector('[name="certificate_type"]').value = prefill.certificate_type;
        }
    } catch (e) {
        console.error('Error populating selects:', e);
    }
}

async function handleAppointmentSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.patient_id = parseInt(data.patient_id);
    data.professional_id = parseInt(data.professional_id);
    if (data.time && data.time.length === 5) data.time += ':00';

    const appointmentId = document.getElementById('appointment-id-field').value;
    const isEdit = appointmentId && appointmentId !== '';
    const url = isEdit ? `/api/appointments/${appointmentId}` : '/api/appointments';
    const method = isEdit ? 'PUT' : 'POST';
    delete data.appointment_id;

    try {
        const response = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal('appointment-modal');
            form.reset();
            document.getElementById('appointment-id-field').value = '';
            fetchAppointments();
            fetchDashboardData();
        } else {
            const err = await response.json();
            alert('Erro ao agendar: ' + (err.detail || JSON.stringify(err)));
        }
    } catch (e) {
        console.error('Error saving appointment:', e);
    }
}

async function deleteAppointment(id) {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
        const response = await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchAppointments();
            fetchDashboardData();
        }
    } catch (e) {
        console.error('Error deleting appointment:', e);
    }
}
