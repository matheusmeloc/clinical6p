// ===== DASHBOARD =====
// KPIs, agenda do dia, Gridstack, gráfico Chart.js e calendário.

// ----- ESTADO -----

let dashboardGrid = null;

let appointmentsChart = null;
let currentChartPeriod = 'daily';

let calendarMonth = new Date().getMonth() + 1;
let calendarYear = new Date().getFullYear();
let calendarMode = 'month'; // 'month' | 'week'
let calendarWeekStart = null;
let calendarData = {};

// Inicializa início da semana (segunda-feira da semana atual)
(function () {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    calendarWeekStart = new Date(today.setDate(diff));
})();

// ----- LAYOUT PADRÃO -----

const DEFAULT_LAYOUT = [
    { id: 'kpi-patients', x: 0, y: 0, w: 3, h: 3 },
    { id: 'kpi-today', x: 3, y: 0, w: 3, h: 3 },
    { id: 'kpi-next', x: 6, y: 0, w: 3, h: 3 },
    { id: 'kpi-week', x: 9, y: 0, w: 3, h: 3 },
    { id: 'agenda-today', x: 0, y: 3, w: 7, h: 8 },
    { id: 'upcoming', x: 7, y: 3, w: 5, h: 5 },
    { id: 'chart-appointments', x: 0, y: 11, w: 12, h: 5 },
    { id: 'calendar-widget', x: 0, y: 16, w: 6, h: 6 }
];

// ----- KPIs E AGENDA -----

async function fetchDashboardData() {
    try {
        const responseStats = await apiFetch('/api/dashboard/stats');
        const dataStats = await responseStats.json();

        removeSkeleton('kpi-card-patients');
        removeSkeleton('kpi-card-today');
        removeSkeleton('kpi-card-week');
        removeSkeleton('kpi-card-next');

        document.getElementById('kpi-patients').innerText = dataStats.total_patients;
        document.getElementById('kpi-today').innerText = dataStats.appointments_today;
        document.getElementById('kpi-week').innerText = dataStats.appointments_week;
        document.getElementById('kpi-next').innerText = dataStats.next_appointment;

        drawSparkline('sparkline-patients', '#065f46');
        drawSparkline('sparkline-today', '#92400e');
        drawSparkline('sparkline-week', '#f9fafb');
        drawSparkline('sparkline-next', '#3730a3');

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', options);

        // Agenda do dia
        const responseToday = await apiFetch('/api/appointments/today');
        const dataToday = await responseToday.json();
        const agendaList = document.getElementById('today-agenda');
        agendaList.innerHTML = '';

        if (dataToday.length === 0) {
            agendaList.innerHTML = '<div class="timeline-empty"><i class="far fa-calendar" style="font-size:1.5rem;margin-bottom:8px;display:block;opacity:0.5"></i>Nenhum agendamento para hoje.</div>';
        } else {
            dataToday.forEach(appt => {
                const item = document.createElement('div');
                item.className = 'timeline-item' + (appt.status === 'Confirmado' ? ' confirmed' : '');
                item.innerHTML = `
                    <div class="timeline-time">${appt.time}</div>
                    <div class="timeline-content">
                        <div class="timeline-patient clickable-patient" onclick="openPatientInfo(${appt.patient_id})" style="cursor:pointer;color:var(--primary);font-weight:600;">${appt.patient_name}</div>
                        <div class="timeline-professional">${appt.professional_name}</div>
                    </div>
                    <div class="timeline-status">
                        <span class="status-badge status-${getStatusClass(appt.status)}">${appt.status}</span>
                    </div>
                `;
                agendaList.appendChild(item);
            });
        }

        // Próximos agendamentos
        const responseUpcoming = await apiFetch('/api/appointments/upcoming');
        const dataUpcoming = await responseUpcoming.json();
        const upcomingList = document.getElementById('upcoming-list');
        upcomingList.innerHTML = '';

        if (dataUpcoming.length === 0) {
            upcomingList.innerHTML = '<p class="text-muted" style="text-align:center;padding:var(--spacing-md)">Nenhum agendamento futuro.</p>';
        } else {
            dataUpcoming.forEach(appt => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.innerHTML = `
                    <div style="width: 80px; font-size: 0.85rem; color: var(--text-muted);">${appt.date}</div>
                    <div style="flex: 1;">
                        <div class="clickable-patient" onclick="openPatientInfo(${appt.patient_id})" style="font-size: 0.95rem; font-weight: 500; cursor:pointer; color:var(--primary);">${appt.patient_name}</div>
                        <div class="text-sm text-muted">${appt.professional_name}</div>
                    </div>
                `;
                upcomingList.appendChild(item);
            });
        }
    } catch (e) {
        console.error('Error fetching dashboard data:', e);
        const agendaFallback = document.getElementById('today-agenda');
        if (agendaFallback) agendaFallback.innerHTML = '<div class="timeline-empty"><i class="far fa-calendar" style="font-size:1.5rem;margin-bottom:8px;display:block;opacity:0.5"></i>Erro ao carregar agenda.</div>';
        const upcomingFallback = document.getElementById('upcoming-list');
        if (upcomingFallback) upcomingFallback.innerHTML = '<p class="text-muted" style="text-align:center;padding:var(--spacing-md)">Erro ao carregar atendimentos.</p>';
    }
}

// ----- GRIDSTACK -----

function initGridStack() {
    const gridEl = document.getElementById('dashboard-grid');
    if (!gridEl || !window.GridStack) return;

    const savedLayout = localStorage.getItem('dashboard-layout');

    dashboardGrid = GridStack.init({
        column: 12,
        cellHeight: 80,
        margin: 0,
        animate: true,
        float: true,
        resizable: { handles: 'n,e,s,w,ne,se,sw,nw' },
        draggable: { handle: '.grid-stack-item-content' }
    }, '#dashboard-grid');

    if (savedLayout) {
        try {
            const items = JSON.parse(savedLayout);
            dashboardGrid.batchUpdate();
            items.forEach(item => {
                const el = gridEl.querySelector(`[gs-id="${item.id}"]`);
                if (el) {
                    dashboardGrid.update(el, { x: item.x, y: item.y, w: item.w, h: item.h });
                }
            });
            dashboardGrid.batchUpdate(false);
        } catch (e) {
            console.warn('Failed to restore dashboard layout:', e);
        }
    }

    dashboardGrid.on('change', function () {
        saveDashboardLayout();
    });

    loadSavedColors();
    loadChartData('daily');
    loadCalendar();
}

function saveDashboardLayout() {
    if (!dashboardGrid) return;
    const items = dashboardGrid.getGridItems().map(el => ({
        id: el.getAttribute('gs-id'),
        x: parseInt(el.getAttribute('gs-x')),
        y: parseInt(el.getAttribute('gs-y')),
        w: parseInt(el.getAttribute('gs-w')),
        h: parseInt(el.getAttribute('gs-h'))
    }));
    localStorage.setItem('dashboard-layout', JSON.stringify(items));
}

function resetDashboardLayout() {
    if (!dashboardGrid) return;
    dashboardGrid.batchUpdate();
    const gridEl = document.getElementById('dashboard-grid');
    DEFAULT_LAYOUT.forEach(item => {
        const el = gridEl.querySelector(`[gs-id="${item.id}"]`);
        if (el) {
            dashboardGrid.update(el, { x: item.x, y: item.y, w: item.w, h: item.h });
        }
    });
    dashboardGrid.batchUpdate(false);
    localStorage.removeItem('dashboard-layout');
    if (typeof showToast === 'function') showToast('Layout restaurado com sucesso!');
}

// ----- GRÁFICO (Chart.js) -----

async function loadChartData(period) {
    currentChartPeriod = period;
    try {
        const resp = await apiFetch(`/api/dashboard/chart-data?period=${period}`);
        if (!resp.ok) throw new Error('Fetch failed');
        const data = await resp.json();
        renderChart(data.labels, data.data);
    } catch (e) {
        console.warn('Failed to load chart data:', e);
        renderChart([], []);
    }
}

function renderChart(labels, data) {
    const ctx = document.getElementById('appointments-chart');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (style.getPropertyValue('--bg-main') || '').trim().startsWith('#1');
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.15)';
    const labelColor = isDark ? '#cbd5e1' : '#1e293b';

    if (appointmentsChart) {
        appointmentsChart.destroy();
    }

    Chart.register(ChartDataLabels);

    appointmentsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Agendamentos',
                data: data,
                backgroundColor: '#00bfa5',
                hoverBackgroundColor: '#00e5c3',
                borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 30, right: 16, bottom: 8, left: 8 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: labelColor,
                    font: { size: 13, weight: '600', family: "'Inter', sans-serif" },
                    formatter: (value) => value > 0 ? value : ''
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#475569',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: true,
                    boxWidth: 12,
                    boxHeight: 12,
                    boxPadding: 4,
                    usePointStyle: true,
                    callbacks: {
                        label: (ctx) => ` ${ctx.parsed.y} agendamento${ctx.parsed.y !== 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: '500', family: "'Inter', sans-serif" },
                        padding: 8
                    },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawTicks: false },
                    ticks: {
                        color: textColor,
                        font: { size: 12, family: "'Inter', sans-serif" },
                        stepSize: 1,
                        precision: 0,
                        padding: 8
                    },
                    border: { display: false }
                }
            },
            animation: { duration: 700, easing: 'easeOutQuart' }
        }
    });
}

function setChartPeriod(el) {
    const period = el.getAttribute('data-period');
    el.closest('.widget-period-menu').querySelectorAll('.period-option').forEach(opt => {
        opt.classList.remove('active');
    });
    el.classList.add('active');
    el.closest('.widget-period-menu').classList.remove('open');
    const btn = el.closest('.widget-period-toggle').querySelector('.widget-period-btn');
    if (btn) btn.classList.remove('active');
    loadChartData(period);
}

// ----- CALENDÁRIO -----

function toggleCalendarMode() {
    const btn = document.getElementById('cal-mode-toggle');
    if (calendarMode === 'month') {
        calendarMode = 'week';
        btn.textContent = 'Mês';
        btn.title = 'Visualização Mensal';
    } else {
        calendarMode = 'month';
        btn.textContent = 'Semana';
        btn.title = 'Visualização Semanal';
    }
    loadCalendar();
}

function changeCalendarOffset(offset) {
    if (calendarMode === 'month') {
        changeCalendarMonth(offset);
    } else {
        changeCalendarWeek(offset);
    }
}

function changeCalendarWeek(offset) {
    calendarWeekStart.setDate(calendarWeekStart.getDate() + (offset * 7));
    calendarMonth = calendarWeekStart.getMonth() + 1;
    calendarYear = calendarWeekStart.getFullYear();
    loadCalendar();
}

function changeCalendarMonth(offset) {
    calendarMonth += offset;
    if (calendarMonth > 12) {
        calendarMonth = 1;
        calendarYear++;
    } else if (calendarMonth < 1) {
        calendarMonth = 12;
        calendarYear--;
    }
    loadCalendar();
}

async function loadCalendar() {
    try {
        const resp = await apiFetch(`/api/dashboard/calendar?month=${calendarMonth}&year=${calendarYear}`);
        if (!resp.ok) throw new Error('Fetch failed');
        const data = await resp.json();
        calendarData = data.appointments || {};

        if (calendarMode === 'month') {
            buildCalendarGrid(data);
        } else {
            buildCalendarWeek(data);
        }
    } catch (e) {
        console.warn('Failed to load calendar:', e);
    }
}

function buildCalendarWeek(data) {
    const container = document.getElementById('calendar-grid');
    if (!container) return;

    const label = document.getElementById('calendar-month-label');
    const endOfWeek = new Date(calendarWeekStart);
    endOfWeek.setDate(calendarWeekStart.getDate() + 6);

    const startStr = calendarWeekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const endStr = endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    if (label) label.textContent = `${startStr} - ${endStr}`;

    let html = '<div class="calendar-week-view" style="display:grid;grid-template-columns:50px repeat(7, 1fr);gap:1px;background:var(--border-subtle);border:1px solid var(--border-subtle);border-radius:8px;overflow:hidden;">';

    html += '<div class="cal-week-header" style="background:var(--bg-surface);padding:10px;"></div>';
    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(calendarWeekStart);
        d.setDate(calendarWeekStart.getDate() + i);
        const isToday = d.toDateString() === new Date().toDateString();
        const dayNum = d.getDate();

        html += `<div class="cal-week-header ${isToday ? 'today' : ''}" style="background:var(--bg-surface);padding:10px;text-align:center;border-bottom:1px solid var(--border-subtle);">
            <div style="font-size:0.75rem;color:var(--text-tertiary);">${weekDays[i]}</div>
            <div style="font-size:1.1rem;font-weight:700;color:${isToday ? 'var(--primary)' : 'var(--text-main)'};">${dayNum}</div>
        </div>`;
    }

    for (let hour = 8; hour <= 18; hour++) {
        const timeLabel = `${String(hour).padStart(2, '0')}:00`;
        html += `<div class="cal-time-slot" style="background:var(--bg-surface);padding:5px;font-size:0.75rem;color:var(--text-tertiary);text-align:right;border-right:1px solid var(--border-subtle);">${timeLabel}</div>`;

        for (let i = 0; i < 7; i++) {
            const d = new Date(calendarWeekStart);
            d.setDate(calendarWeekStart.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const appts = calendarData[dateStr] || [];
            const hourAppts = appts.filter(a => parseInt(a.time.split(':')[0]) === hour);

            html += `<div class="cal-week-cell" style="background:var(--bg-surface);border-bottom:1px solid var(--border-subtle);position:relative;min-height:50px;padding:2px;">`;

            hourAppts.forEach(a => {
                let bgColor = 'var(--bg-body)';
                let statusColor = 'var(--text-main)';
                const st = (a.status || '').toLowerCase();
                if (st.includes('confirm')) { bgColor = '#dcfce7'; statusColor = '#166534'; }
                else if (st.includes('aguard')) { bgColor = '#fef9c3'; statusColor = '#854d0e'; }

                html += `<div class="cal-week-appt clickable" onclick="openPatientInfo(${a.patient_id})"
                    style="background:${bgColor};color:${statusColor};font-size:0.7rem;padding:2px 4px;border-radius:4px;margin-bottom:2px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${a.time.substr(3, 2)} ${a.patient}
                </div>`;
            });

            html += `</div>`;
        }
    }

    html += '</div>';
    container.innerHTML = html;

    const detail = document.getElementById('calendar-day-detail');
    if (detail) detail.style.display = 'none';
}

function buildCalendarGrid(data) {
    const container = document.getElementById('calendar-grid');
    if (!container) return;

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const label = document.getElementById('calendar-month-label');
    if (label) label.textContent = `${monthNames[data.month - 1]} ${data.year}`;

    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === data.month && today.getFullYear() === data.year;
    const todayDay = today.getDate();

    let html = '<div class="calendar-weekdays" style="display:grid;grid-template-columns:repeat(7, 1fr);gap:4px;margin-bottom:4px;">';
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach(d => {
        html += `<div class="calendar-weekday" style="text-align:center;font-size:0.8rem;color:var(--text-tertiary);padding:4px;">${d}</div>`;
    });
    html += '</div><div class="calendar-days" style="display:grid;grid-template-columns:repeat(7, 1fr);gap:4px;">';

    for (let i = 0; i < data.first_weekday; i++) {
        html += '<div class="calendar-day empty" style="aspect-ratio:1;background:transparent;"></div>';
    }

    for (let day = 1; day <= data.days_in_month; day++) {
        const dateStr = `${data.year}-${String(data.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const appts = data.appointments[dateStr] || [];
        const isToday = isCurrentMonth && day === todayDay;
        const hasAppts = appts.length > 0;

        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (hasAppts) classes += ' has-appointments';

        html += `<div class="${classes}" onclick="showDayDetail('${dateStr}', ${day})"
            style="aspect-ratio:1;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border-subtle);padding:4px;cursor:pointer;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">`;

        if (isToday) {
            html += `<span class="calendar-day-number" style="font-weight:700;color:var(--primary);">${day}</span>`;
        } else {
            html += `<span class="calendar-day-number" style="color:var(--text-secondary);">${day}</span>`;
        }

        if (hasAppts) {
            html += '<div class="calendar-day-dots" style="display:flex;gap:2px;margin-top:2px;">';
            appts.slice(0, 4).forEach(a => {
                let color = '#cbd5e1';
                const st = (a.status || '').toLowerCase();
                if (st.includes('confirm')) color = '#22c55e';
                else if (st.includes('aguard')) color = '#eab308';
                else if (st.includes('cancel')) color = '#ef4444';
                else if (st.includes('conclu')) color = '#3b82f6';
                html += `<span style="width:4px;height:4px;border-radius:50%;background:${color};"></span>`;
            });
            if (appts.length > 4) html += `<span style="font-size:0.55rem;color:var(--text-tertiary)">+</span>`;
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    const detail = document.getElementById('calendar-day-detail');
    if (detail) detail.style.display = 'none';
}

function showDayDetail(dateStr, day) {
    const appts = calendarData[dateStr] || [];
    const detail = document.getElementById('calendar-day-detail');
    const list = document.getElementById('calendar-detail-list');
    if (!detail || !list) return;

    if (appts.length === 0) {
        detail.style.display = 'none';
        return;
    }

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const headerHtml = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <span style="font-weight:600;color:var(--text-main);">${day} de ${monthNames[calendarMonth - 1]}</span>
            <button onclick="document.getElementById('calendar-day-detail').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);">&times;</button>
        </div>
    `;

    let itemsHtml = '';
    appts.forEach(a => {
        let statusClass = '';
        const st = (a.status || '').toLowerCase();
        if (st.includes('confirm')) statusClass = 'status-confirmed';
        else if (st.includes('aguard')) statusClass = 'status-pending';
        else if (st.includes('cancel')) statusClass = 'status-cancelled';

        itemsHtml += `
            <div class="calendar-appt-item" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border-bottom:1px solid var(--border-subtle);">
                <span style="font-weight:600;font-size:0.9rem;min-width:45px;">${a.time}</span>
                <span class="clickable-patient" onclick="openPatientInfo(${a.patient_id})" style="flex:1;cursor:pointer;color:var(--primary);font-weight:500;">${a.patient}</span>
                <span class="status-badge ${statusClass}" style="font-size:0.7rem;">${a.status}</span>
            </div>`;
    });

    detail.innerHTML = headerHtml + '<div style="max-height:200px;overflow-y:auto;">' + itemsHtml + '</div>';
    detail.style.display = 'block';
}
