import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  Home,
  Briefcase,
  User,
  CalendarDays,
  FileText,
  FileCheck,
  Mail,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { key: "dashboard",    label: "Dashboard",     icon: Home,         path: "/dashboard" },
  { key: "funcionarios", label: "Funcionários",   icon: Briefcase,    path: "/funcionarios" },
  { key: "pacientes",    label: "Pacientes",      icon: User,         path: "/pacientes" },
  { key: "agendamentos", label: "Agendamentos",   icon: CalendarDays, path: "/agendamentos" },
  { key: "receitas",     label: "Receitas",       icon: FileText,     path: "/receitas" },
  { key: "atestados",    label: "Atestados",      icon: FileCheck,    path: "/atestados" },
  { key: "mensagens",    label: "Mensagens",      icon: Mail,         path: "/mensagens" },
];

const getUserInitials = (fullName = "") =>
  fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function NavItem({ item, active, onClick, isCollapsed }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "w-full flex items-center rounded-md text-sm font-medium transition-colors h-9 px-3",
        active
          ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100",
        isCollapsed && "justify-center px-0 w-9 mx-auto",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", !isCollapsed && "mr-3")} />
      {!isCollapsed && <span>{item.label}</span>}
    </button>
  );
}

function SidebarContent({ user, isCollapsed, onNavigate, onLogout, onToggleCollapse, onClose, isMobile }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-[60px] items-center justify-between px-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
        {(!isCollapsed || isMobile) ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0 shadow-sm">
                IP
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm leading-none text-slate-900 dark:text-slate-100 truncate">
                  Inst. de Psicologia
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sistema clínico</span>
              </div>
            </div>
            <button
              onClick={isMobile ? onClose : onToggleCollapse}
              className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 shrink-0 transition-colors"
              aria-label={isMobile ? "Fechar menu" : "Recolher painel"}
            >
              {isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </>
        ) : (
          <div className="relative w-full flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-sm">
              IP
            </div>
            <button
              onClick={onToggleCollapse}
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 shadow-sm z-30 transition-colors"
              title="Expandir painel"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {(!isCollapsed || isMobile) && (
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navegação
          </p>
        )}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={false}
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => onNavigate(item)}
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className={cn("border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0", isCollapsed && !isMobile ? "p-2" : "p-4")}>
        {isCollapsed && !isMobile ? (
          <div className="flex flex-col items-center gap-3">
            {user?.photo ? (
              <img src={user.photo} alt="Foto" className="h-9 w-9 rounded-lg object-cover shadow-sm" title={user?.full_name || "Usuário"} />
            ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold uppercase text-white shadow-sm"
              title={user?.full_name || "Usuário"}
            >
              {getUserInitials(user?.full_name)}
            </div>
            )}
            <button
              onClick={() => onNavigate({ path: "/configuracoes" })}
              className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={onLogout}
              className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50/50 dark:bg-slate-700/50 p-2 border border-slate-100/50 dark:border-slate-600/50">
              {user?.photo ? (
                <img src={user.photo} alt="Foto" className="h-9 w-9 rounded-lg object-cover shadow-sm shrink-0" />
              ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold uppercase text-white shadow-sm shrink-0">
                {getUserInitials(user?.full_name)}
              </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || "Usuário"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.role === "admin" ? "Administrador" : user?.role || "Profissional"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <button onClick={() => onNavigate({ path: "/configuracoes" })} className="w-full flex items-center h-9 px-3 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                <Settings className="mr-3 h-[18px] w-[18px] shrink-0" />
                Configurações
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center h-9 px-3 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="mr-3 h-[18px] w-[18px] shrink-0" />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ user, onSelect, onLogout, isOpen, onClose, isCollapsed = false, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Fecha o menu mobile ao apertar Escape
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape" && isOpen) onClose?.(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  // Bloqueia scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleNavigation = (item) => {
    onSelect?.(item.key);
    navigate(item.path);
    onClose?.();
  };

  return (
    <>
      {/* ── Mobile overlay + drawer (< lg) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay escuro */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative z-10 w-[280px] h-full bg-white dark:bg-slate-800 shadow-2xl border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <SidebarContent
              user={user}
              isCollapsed={false}
              isMobile={true}
              onNavigate={handleNavigation}
              onLogout={onLogout}
              onClose={onClose}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar (≥ lg) ── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 ease-in-out hidden lg:flex lg:flex-col z-20",
          isCollapsed ? "w-[70px]" : "w-[270px]",
        )}
      >
        <SidebarContent
          user={user}
          isCollapsed={isCollapsed}
          isMobile={false}
          onNavigate={handleNavigation}
          onLogout={onLogout}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>
    </>
  );
}

export default Sidebar;
