import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import Sidebar from "../components/Sidebar";
import { ArrowRight, LogOut, Menu } from "lucide-react";

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
  receitas: "Receitas",
  atestados: "Atestados",
  mensagens: "Mensagens",
};

const getSectionFromPath = (pathname) => {
  if (pathname.startsWith("/funcionarios")) return "funcionarios";
  if (pathname.startsWith("/pacientes")) return "pacientes";
  if (pathname.startsWith("/agendamentos")) return "agendamentos";
  if (pathname.startsWith("/receitas")) return "receitas";
  if (pathname.startsWith("/atestados")) return "atestados";
  if (pathname.startsWith("/mensagens")) return "mensagens";
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex">
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
        className={`flex-1 min-h-screen p-6 sm:p-10 space-y-8 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "xl:ml-[70px]" : "xl:ml-[270px]"
        }`}
      >
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 xl:hidden h-auto shrink-0"
              >
                <Menu className="h-4 w-4" />
                Menu
              </Button>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 font-semibold">
                  Instituto de Psicologia
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {showDashboardGreeting
                    ? user
                      ? `Olá, ${user.full_name}`
                      : "Bem-vindo ao painel"
                    : pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 pt-1">
              <Button variant="dark" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
              <Button
                onClick={() => navigate("/agendamentos")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" /> Ver consultas
              </Button>
            </div>
          </div>

          {showDashboardGreeting && (
            <p className="max-w-2xl text-slate-500 text-sm leading-relaxed">
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
