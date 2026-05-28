// ===== UI UTILITIES =====
// Funções de interface: modais, toast, sidebar, tema, sparklines,
// máscaras de input e navegação entre views.

// ----- MODAIS -----

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ----- SKELETON LOADER -----

function removeSkeleton(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.remove('skeleton', 'skeleton-card');
    }
}

// ----- STATUS HELPER -----

function getStatusClass(status) {
    if (!status) return 'pending';
    const s = status.toString();
    if (s === 'Confirmado' || s === 'Active' || s === 'Ativo') return 'confirmed';
    if (s === 'Cancelado' || s === 'Inactive' || s === 'Inativo') return 'cancelled';
    if (s === 'Concluído' || s === 'Concluido') return 'completed';
    return 'pending';
}

// ----- TOAST NOTIFICATIONS -----

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;

    const icon = type === 'error'
        ? '<i class="fas fa-exclamation-circle"></i>'
        : '<i class="fas fa-check-circle"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ----- SIDEBAR -----

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const icon = document.getElementById('toggle-icon');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
    } else {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
    }
}

// ----- ADJUSTABLE THEME -----

function updateTheme(percent) {
    document.documentElement.style.setProperty('--theme-inv', percent + '%');

    let textVal = 0;
    const p = parseFloat(percent);
    // Hard snap: manter texto preto até fundo escuro suficiente (>55%), depois branco
    if (p < 55) {
        textVal = 0;
    } else {
        textVal = 100;
    }

    document.documentElement.style.setProperty('--text-inv', textVal + '%');
    localStorage.setItem('theme-percent', percent);
}

// ----- SPARKLINES (SVG) -----

function drawSparkline(containerId, color, dataPoints) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!dataPoints || dataPoints.length === 0) {
        dataPoints = [];
        let val = 3 + Math.random() * 4;
        for (let i = 0; i < 12; i++) {
            val += (Math.random() - 0.4) * 2;
            val = Math.max(1, Math.min(10, val));
            dataPoints.push(val);
        }
    }

    const w = 200;
    const h = 50;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;
    const step = w / (dataPoints.length - 1);

    let pathD = '';
    const points = dataPoints.map((v, i) => ({
        x: i * step,
        y: h - ((v - min) / range) * (h - 8) - 4
    }));

    pathD = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const cp1x = points[i - 1].x + step * 0.4;
        const cp1y = points[i - 1].y;
        const cp2x = points[i].x - step * 0.4;
        const cp2y = points[i].y;
        pathD += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`;
    }

    const fillD = pathD + ` L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

    container.innerHTML = `
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
            <defs>
                <linearGradient id="grad-${containerId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <path d="${fillD}" fill="url(#grad-${containerId})" />
            <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
}

// ----- NAVIGATION -----

function loadView(viewName) {
    const titles = {
        'dashboard': 'Dashboard',
        'funcionarios': 'Funcionários',
        'pacientes': 'Pacientes',
        'agendamentos': 'Agendamentos',
        'receitas': 'Receitas',
        'atestados': 'Atestados',
        'configuracoes': 'Configurações'
    };
    document.getElementById('page-title').innerText = titles[viewName] || 'Sistema';

    const resetLayoutBtn = document.getElementById('reset-layout-btn');
    const resetColorsBtn = document.getElementById('reset-colors-btn');
    if (resetLayoutBtn) resetLayoutBtn.style.display = viewName === 'dashboard' ? 'inline-block' : 'none';
    if (resetColorsBtn) resetColorsBtn.style.display = viewName === 'dashboard' ? 'inline-block' : 'none';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = Array.from(document.querySelectorAll('.nav-item'))
        .find(el => el.onclick && el.onclick.toString().includes(viewName));
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');

    const target = document.getElementById('view-' + viewName);
    if (target) {
        target.style.display = 'block';
        if (viewName === 'pacientes') fetchPatients();
        if (viewName === 'agendamentos') fetchAppointments();
        if (viewName === 'funcionarios') fetchProfessionals();
        if (viewName === 'receitas') fetchPrescriptions();
        if (viewName === 'atestados') fetchCertificates();
        if (viewName === 'mensagens') fetchMessages();
        if (viewName === 'configuracoes') loadProfile();
    } else {
        let placeholder = document.getElementById('view-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.id = 'view-placeholder';
            placeholder.className = 'view-section';
            document.getElementById('content-area').appendChild(placeholder);
        }
        placeholder.style.display = 'block';
        placeholder.innerHTML = `<h2>${titles[viewName]}</h2><p>Funcionalidade em desenvolvimento.</p>`;
    }
}

// ----- PATIENT MODAL TABS -----

function switchPatientTab(tabId) {
    document.querySelectorAll('.patient-tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.style.color = 'var(--text-muted)';
        btn.style.borderBottom = 'none';
    });
    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');
}

// ----- PROFILE MODAL TABS -----

function switchProfileTab(tabId, el) {
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--text-muted)';
        t.style.borderBottom = '2px solid transparent';
    });
    el.classList.add('active');
    el.style.color = 'var(--primary)';
    el.style.borderBottom = '2px solid var(--primary)';

    document.querySelectorAll('.profile-content-section').forEach(s => s.style.display = 'none');
    document.getElementById('profile-tab-' + tabId).style.display = 'block';
}

// ----- PERIOD SELECTOR (WIDGET MENUS) -----

function togglePeriodMenu(btn) {
    const menu = btn.nextElementSibling;
    document.querySelectorAll('.widget-period-menu.open').forEach(m => {
        if (m !== menu) m.classList.remove('open');
    });
    document.querySelectorAll('.widget-period-btn.active').forEach(b => {
        if (b !== btn) b.classList.remove('active');
    });
    menu.classList.toggle('open');
    btn.classList.toggle('active');
}

function setPeriod(optionEl) {
    const menu = optionEl.closest('.widget-period-menu');
    const btn = menu.previousElementSibling;
    const period = optionEl.dataset.period;

    menu.querySelectorAll('.period-option').forEach(o => o.classList.remove('active'));
    optionEl.classList.add('active');

    menu.classList.remove('open');
    btn.classList.remove('active');

    const gridItem = optionEl.closest('.grid-stack-item');
    const widgetId = gridItem ? gridItem.getAttribute('gs-id') : 'unknown';

    const prefs = JSON.parse(localStorage.getItem('widget-periods') || '{}');
    prefs[widgetId] = period;
    localStorage.setItem('widget-periods', JSON.stringify(prefs));
}

// ----- COLOR PICKER -----

function openColorPicker(btn) {
    const colorInput = btn.nextElementSibling;
    if (colorInput) colorInput.click();
}

function applyCardColor(input) {
    const color = input.value;
    const gridItem = input.closest('.grid-stack-item');
    const card = gridItem.querySelector('.kpi-card, .card.widget-card');
    const widgetId = gridItem.getAttribute('gs-id');

    if (card) {
        card.style.backgroundColor = color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        card.style.color = luminance > 0.5 ? '#1e293b' : '#f8fafc';
    }

    const colors = JSON.parse(localStorage.getItem('widget-colors') || '{}');
    colors[widgetId] = color;
    localStorage.setItem('widget-colors', JSON.stringify(colors));
}

function resetCardColors() {
    if (!confirm('Deseja restaurar as cores originais dos cards?')) return;
    localStorage.removeItem('widget-colors');
    document.querySelectorAll('#dashboard-grid .grid-stack-item').forEach(item => {
        const card = item.querySelector('.kpi-card, .card.widget-card');
        if (card) {
            card.style.backgroundColor = '';
            card.style.color = '';
        }
    });
    if (typeof showToast === 'function') showToast('Cores restauradas com sucesso!');
}

function loadSavedColors() {
    const colors = JSON.parse(localStorage.getItem('widget-colors') || '{}');
    Object.entries(colors).forEach(([widgetId, color]) => {
        const gridItem = document.querySelector(`[gs-id="${widgetId}"]`);
        if (!gridItem) return;
        const card = gridItem.querySelector('.kpi-card, .card.widget-card');
        if (card) {
            card.style.backgroundColor = color;
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            card.style.color = luminance > 0.5 ? '#1e293b' : '#f8fafc';
        }
    });
}

// ----- INPUT MASKS -----

function initInputMasks() {
    document.addEventListener('input', function (e) {
        const name = e.target.name;
        if (!name) return;

        // CPF: 123.456.789-01
        if (name === 'cpf') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = v;
        }

        // Telefone: (11) 91234-5678
        if (name === 'phone' || name === 'emergency_contact_phone') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
            v = v.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = v;
        }

        // CEP: 01234-567
        if (name === 'address_cep') {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 8) v = v.slice(0, 8);
            v = v.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = v;
        }

        // Somente números
        const numberFields = ['address_number', 'insurance_number', 'age', 'duration_days'];
        if (numberFields.includes(name)) {
            e.target.value = e.target.value.replace(/\D/g, '');
        }
    });
}
