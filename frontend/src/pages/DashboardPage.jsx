import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu } from "lucide-react";

const getUserFromStorage = () => {
  const stored = localStorage.getItem("user");
  if (!stored || stored === "undefined" || stored === "null") return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const pageTitleMap = {
  dashboard: "Dashboard",
  funcionarios: "Funcionários",
  pacientes: "Pacientes",
  agendamentos: "Agendamentos",
  atestados: "Atestados",
  mensagens: "Mensagens",
  configuracoes: "Configurações",
};

const getSectionFromPath = (pathname) => {
  if (pathname.startsWith("/funcionarios")) return "funcionarios";
  if (pathname.startsWith("/pacientes")) return "pacientes";
  if (pathname.startsWith("/agendamentos")) return "agendamentos";
  if (pathname.startsWith("/atestados")) return "atestados";
  if (pathname.startsWith("/mensagens")) return "mensagens";
  if (pathname.startsWith("/configuracoes")) return "configuracoes";
  return "dashboard";
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => getUserFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  const activeSection = getSectionFromPath(location.pathname);
  const pageTitle = pageTitleMap[activeSection] ?? "Dashboard";
  const showDashboardGreeting = activeSection === "dashboard";

  useEffect(() => {
    document.title = `IP | ${pageTitle}`;
  }, [pageTitle]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        user={user}
        activeItem={activeSection}
        onSelect={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => {
          setSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("sidebarCollapsed", String(next));
            return next;
          });
        }}
      />
      <main
        className={`flex-1 min-h-screen p-4 sm:p-6 lg:p-10 space-y-6 transition-all duration-300 ease-in-out overflow-x-hidden bg-slate-50 dark:bg-slate-900 ${
          sidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-[270px]"
        }`}
      >
        <header className="space-y-3">
          {/* Linha 1: menu + instituição + botões */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                Instituto de Psicologia
              </p>
            </div>
          </div>

          {/* Linha 2: título da página */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            {showDashboardGreeting
              ? user
                ? `Olá, ${user.full_name.split(" ")[0]}`
                : "Bem-vindo"
              : pageTitle}
          </h1>

          {showDashboardGreeting && (
            <p className="max-w-2xl text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Bem-vindo ao painel. Aqui você encontrará um resumo rápido do seu
              fluxo de trabalho e acesso direto às principais funcionalidades.
            </p>
          )}
        </header>

        <div className="space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

