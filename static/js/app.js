// App Logic & Routing

const routes = {
    '/': renderDashboard,
    '/dashboard': renderDashboard,
    '/usuarios': renderUsers,
    '/funcionarios': renderEmployees,
    '/pacientes': renderPatients,
    '/agendamentos': renderAppointments,
    '/receitas': renderPrescriptions,
    '/atestados': renderCertificates,
    '/configuracoes': renderSettings
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');

    // Intercept clicks for SPA navigation
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a[data-page]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        }
    });

    // Handle initial load
    handleRoute(window.location.pathname);

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        handleRoute(window.location.pathname);
    });
});

function navigateTo(path) {
    window.history.pushState({}, path, window.location.origin + path);
    handleRoute(path);
}

function handleRoute(path) {
    const renderFunction = routes[path] || routes['/dashboard']; // Default to dashboard

    // Update Active State in Sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        const isActive = linkPath === path || (path === '/' && linkPath === '/dashboard');

        if (isActive) {
            link.classList.add('text-text-main', 'bg-surface'); // Active styling for minimalist sidebar
            link.classList.remove('text-text-muted');
        } else {
            link.classList.remove('text-text-main', 'bg-surface');
            link.classList.add('text-text-muted');
        }
    });

    // Update Breadcrumb
    const breadcrumb = document.getElementById('page-breadcrumb');
    if (breadcrumb) {
        const pageTitles = {
            '/': 'Dashboard',
            '/dashboard': 'Dashboard',
            '/usuarios': 'Usuários',
            '/funcionarios': 'Funcionários',
            '/pacientes': 'Pacientes',
            '/agendamentos': 'Agendamentos',
            '/receitas': 'Receitas',
            '/atestados': 'Atestados',
            '/configuracoes': 'Configurações'
        };
        breadcrumb.textContent = pageTitles[path] || 'Dashboard';
    }

    // Render Content
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = renderFunction();
    feather.replace();
}

// --- View Renderers ---


function renderDashboard() {
    return `
        <!-- Minimalist Dashboard Content -->
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <!-- Card 1: Mint -->
            <div class="bg-primary/20 p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                 <div>
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-dark mb-4 shadow-sm">
                        <i data-feather="users" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-text-main mb-1">1,248</h3>
                    <p class="text-sm font-medium text-text-muted">Total de Pacientes</p>
                 </div>
                 <div class="w-24 h-24 bg-white/30 rounded-full absolute -right-6 -bottom-6 group-hover:scale-125 transition-transform duration-500"></div>
            </div>
            
            <!-- Card 2: Yellow -->
            <div class="bg-secondary p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                 <div>
                     <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-yellow-600 mb-4 shadow-sm">
                        <i data-feather="calendar" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-text-main mb-1">42</h3>
                    <p class="text-sm font-medium text-text-muted">Agendamentos Hoje</p>
                 </div>
                 <div class="w-24 h-24 bg-white/30 rounded-full absolute -right-6 -bottom-6 group-hover:scale-125 transition-transform duration-500"></div>
            </div>

            <!-- Card 3: Dark -->
            <div class="bg-text-main p-8 rounded-[2rem] flex items-center justify-between relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                 <div class="z-10 relative">
                     <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                        <i data-feather="dollar-sign" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white mb-1">R$ 15k</h3>
                    <p class="text-sm font-medium text-text-muted">Faturamento do Mês</p>
                 </div>
                 <div class="w-32 h-32 bg-primary absolute -right-4 -top-4 rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity"></div>
            </div>
        </div>

        <div class="flex gap-8">
            <!-- Main Content Area (Chart Placeholder for now, styled as big card) -->
            <div class="flex-1 bg-surface p-8 rounded-[2.5rem] min-h-[400px] border border-gray-50 shadow-sm relative overflow-hidden">
                <h3 class="text-lg font-bold text-text-main mb-6">Fluxo de Pacientes</h3>
                <!-- Curved Line Decoration representing chart -->
                <svg class="w-full h-full absolute bottom-0 left-0 text-primary opacity-30" viewBox="0 0 400 200" preserveAspectRatio="none">
                     <path d="M0,150 C100,100 200,180 300,80 C350,30 400,100 400,100 L400,200 L0,200 Z" fill="currentColor" />
                </svg>
                 <svg class="w-full h-full absolute bottom-0 left-0 text-secondary opacity-40 translate-y-4" viewBox="0 0 400 200" preserveAspectRatio="none">
                     <path d="M0,180 C150,150 250,190 400,120 L400,200 L0,200 Z" fill="currentColor" />
                </svg>
            </div>
        </div>
    `;
}

function renderEmployees() {
    return `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-text-main">Funcionários</h2>
            <button class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-sm">
                <i data-feather="plus" class="w-4 h-4"></i>
                Cadastrar Funcionário
            </button>
        </div>
        
        <!-- KPI Cards for Employees -->
        <div class="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            <div class="bg-surface p-4 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
                <div class="p-3 bg-green-50 text-primary rounded-full">
                    <i data-feather="users" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="text-xs text-text-muted uppercase font-bold tracking-wide">Total</p>
                    <p class="text-xl font-bold text-text-main">10</p>
                </div>
            </div>
            <div class="bg-surface p-4 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
                <div class="p-3 bg-purple-50 text-purple-600 rounded-full">
                    <i data-feather="smile" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="text-xs text-text-muted uppercase font-bold tracking-wide">Psicólogos</p>
                    <p class="text-xl font-bold text-text-main">4</p>
                </div>
            </div>
        </div>

        <div class="bg-surface rounded-xl border border-gray-100 shadow-sm">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div class="relative flex-1 max-w-md">
                    <i data-feather="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"></i>
                    <input type="text" placeholder="Buscar por nome, categoria..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                </div>
                <div class="flex items-center gap-2">
                     <button class="p-2 text-text-muted hover:bg-gray-100 rounded-lg border border-gray-200">
                        <i data-feather="filter" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 text-text-muted font-medium">
                        <tr>
                            <th class="px-6 py-3">Profissional</th>
                            <th class="px-6 py-3">Registro</th>
                            <th class="px-6 py-3">Especialidade</th>
                            <th class="px-6 py-3">Contato</th>
                            <th class="px-6 py-3">Status</th>
                            <th class="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <!-- Example Row -->
                        <tr class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">JD</div>
                                <div>
                                    <p class="font-medium text-text-main">João da Silva</p>
                                    <p class="text-xs text-text-muted">joao.silva@clinica.com</p>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-text-muted">CRP 12/34567</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">Psicólogo</span></td>
                            <td class="px-6 py-4 text-text-muted">(11) 98765-4321</td>
                            <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>Ativo</span></td>
                            <td class="px-6 py-4 text-right">
                                <button class="text-text-muted hover:text-primary p-1"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                                <button class="text-text-muted hover:text-red-500 p-1"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
             <div class="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-text-muted">
                <p>Mostrando 2 de 10 resultados</p>
                <div class="flex gap-2">
                    <button class="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50" disabled>Anterior</button>
                    <button class="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Próxima</button>
                </div>
            </div>
        </div>
    `;
}

function renderUsers() {
    return `<h2 class="text-2xl font-bold text-text-main mb-4">Gerenciamento de Usuários</h2><p class="text-text-muted">Conteúdo de usuários aqui...</p>`;
}
function renderPatients() {
    return `<h2 class="text-2xl font-bold text-text-main mb-4">Pacientes</h2><p class="text-text-muted">Lista de pacientes aqui...</p>`;
}
function renderAppointments() {
    return `<h2 class="text-2xl font-bold text-text-main mb-4">Agendamentos</h2><p class="text-text-muted">Calendário e lista de agendamentos aqui...</p>`;
}
function renderPrescriptions() {
    return `<h2 class="text-2xl font-bold text-text-main mb-4">Receitas</h2><p class="text-text-muted">Gestão de receitas médicas aqui...</p>`;
}
function renderCertificates() {
    return `<h2 class="text-2xl font-bold text-text-main mb-4">Atestados</h2><p class="text-text-muted">Emissão de atestados aqui...</p>`;
}
function renderSettings() {
    return `
        <h2 class="text-2xl font-bold text-text-main mb-6">Configurações</h2>
        
        <div class="bg-surface rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="border-b border-gray-100">
                <nav class="flex">
                    <button class="px-6 py-4 text-primary font-medium border-b-2 border-primary">Perfil</button>
                    <button class="px-6 py-4 text-text-muted hover:text-text-main transition-colors">Clínica</button>
                    <button class="px-6 py-4 text-text-muted hover:text-text-main transition-colors">Segurança</button>
                    <button class="px-6 py-4 text-text-muted hover:text-text-main transition-colors">Notificações</button>
                    <button class="px-6 py-4 text-text-muted hover:text-text-main transition-colors">Sistema</button>
                </nav>
            </div>
            
            <div class="p-8">
                <!-- Profile Tab Content (Default) -->
                <div class="max-w-xl">
                    <h3 class="text-lg font-medium text-text-main mb-6">Dados do Perfil</h3>
                    
                    <div class="flex items-center gap-6 mb-8">
                        <div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            <i data-feather="camera" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Alterar Foto</button>
                            <p class="text-xs text-text-muted mt-2">JPG ou PNG. Max 1MB.</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-text-muted mb-1">Nome</label>
                                <input type="text" value="Admin" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-text-muted mb-1">Sobrenome</label>
                                <input type="text" value="User" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                            </div>
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-text-muted mb-1">Email</label>
                            <input type="email" value="admin@clinica.com" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-text-muted mb-1">Cargo</label>
                            <input type="text" value="Administrador" disabled class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-text-muted cursor-not-allowed">
                        </div>
                        
                        <div class="pt-4 flex justify-end">
                             <button class="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium">Salvar Alterações</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

