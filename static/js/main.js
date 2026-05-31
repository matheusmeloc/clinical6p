// ===== INICIALIZAÇÃO DO APP =====
// Este arquivo é o ponto de entrada. Deve ser carregado por último,
// depois de todos os outros módulos JS.

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded - App Started');

    // Verificação de sessão
    checkAuth();

    // Grid de dashboard arrastável
    initGridStack();

    // Dados do dashboard
    fetchDashboardData();

    // Tema ajustável (slider)
    const themeSlider = document.getElementById('theme-slider');
    if (themeSlider) {
        themeSlider.addEventListener('input', (e) => {
            updateTheme(e.target.value);
        });
        const saved = localStorage.getItem('theme-percent') || '0';
        themeSlider.value = saved;
        updateTheme(saved);
    }

    // Máscaras de input (CPF, telefone, CEP, etc.)
    initInputMasks();

    // Fecha menus de período ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.widget-period-toggle')) {
            document.querySelectorAll('.widget-period-menu.open').forEach(m => m.classList.remove('open'));
            document.querySelectorAll('.widget-period-btn.active').forEach(b => b.classList.remove('active'));
        }
    });
});
