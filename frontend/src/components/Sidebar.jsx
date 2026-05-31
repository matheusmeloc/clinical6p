import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
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
  { key: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  {
    key: "funcionarios",
    label: "Funcionários",
    icon: Briefcase,
    path: "/funcionarios",
  },
  {
    key: "pacientes",
    label: "Pacientes",
    icon: User,
    path: "/pacientes",
  },
  {
    key: "agendamentos",
    label: "Agendamentos",
    icon: CalendarDays,
    path: "/agendamentos",
  },
  {
    key: "receitas",
    label: "Receitas",
    icon: FileText,
    path: "/receitas",
  },
  {
    key: "atestados",
    label: "Atestados",
    icon: FileCheck,
    path: "/atestados",
  },
  {
    key: "mensagens",
    label: "Mensagens",
    icon: Mail,
    path: "/mensagens",
  },
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
    <div className="relative w-full">
      <Button
        type="button"
        variant={active ? "secondary" : "ghost"}
        onClick={onClick}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "w-full justify-start rounded-md text-sm font-medium transition-colors h-9 px-3",
          active
            ? "bg-slate-100 text-slate-900 font-semibold"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          isCollapsed && "justify-center px-0 h-9 w-9 mx-auto",
        )}
      >
        <Icon
          className={cn("h-[18px] w-[18px] shrink-0", !isCollapsed && "mr-3")}
        />
        {!isCollapsed && <span>{item.label}</span>}
      </Button>
    </div>
  );
}

export function Sidebar({
  user,
  onSelect,
  onLogout,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isPathActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const handleNavigation = (item) => {
    if (onSelect) {
      onSelect(item.key);
    }
    navigate(item.path);
    if (isOpen && onClose) {
      onClose();
    }
  };

  return (
    <>
      <Sheet className="xl:hidden" aria-hidden={!isOpen}>
        <div
          className={`fixed inset-0 z-20 bg-slate-950/30 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
        />

        <SheetContent
          className={cn(
            "h-full w-[280px] overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out p-0",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
          side="left"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="flex h-[60px] items-center justify-between px-4 border-b border-slate-100 flex-row gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0 shadow-sm">
                  IP
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm leading-none text-slate-900 truncate">
                    Inst. de Psicologia
                  </span>
                  <span className="text-xs text-slate-500 truncate mt-1">
                    Sistema clínico
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 rounded-md p-0 flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-900 shrink-0"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetHeader>

            <div className="flex-1 overflow-hidden py-4">
              <ScrollArea className="h-full px-3">
                <div className="space-y-4">
                  <div className="px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Navegação
                    </p>
                  </div>
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <NavItem
                        key={item.key}
                        item={item}
                        active={isPathActive(item.path)}
                        isCollapsed={false}
                        onClick={() => handleNavigation(item)}
                      />
                    ))}
                  </nav>
                </div>
              </ScrollArea>
            </div>

            <div className="border-t border-slate-100 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-slate-50/50 p-2 border border-slate-100/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold uppercase text-white shadow-sm shrink-0">
                    {getUserInitials(user?.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.full_name || "Usuário"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {user?.role || "Profissional"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-9 px-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings className="mr-3 h-[18px] w-[18px] shrink-0" />{" "}
                    Configurações
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start text-left h-9 px-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-3 h-[18px] w-[18px] shrink-0" /> Sair
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out hidden xl:flex xl:flex-col z-20",
          isCollapsed ? "w-[70px]" : "w-[270px]",
        )}
      >
        <div className="flex h-full flex-col">
          {isCollapsed ? (
            <div className="flex h-[60px] items-center justify-center border-b border-slate-100 relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-sm">
                IP
              </div>
              <Button
                variant="ghost"
                onClick={onToggleCollapse}
                className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-slate-200 bg-white p-0 flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-900 shadow-sm z-30"
                title="Expandir painel"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex h-[60px] items-center justify-between px-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0 shadow-sm">
                  IP
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm leading-none text-slate-900 truncate">
                    Inst. de Psicologia
                  </span>
                  <span className="text-xs text-slate-500 truncate mt-1">
                    Sistema clínico
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={onToggleCollapse}
                className="h-8 w-8 rounded-md p-0 flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-900 shrink-0"
                title="Recolher painel"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-hidden py-4">
            <ScrollArea className="h-full px-3">
              <div className="space-y-4">
                {!isCollapsed && (
                  <div className="px-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Navegação
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <NavItem
                      key={item.key}
                      item={item}
                      active={isPathActive(item.path)}
                      isCollapsed={isCollapsed}
                      onClick={() => handleNavigation(item)}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div
            className={cn(
              "border-t border-slate-100 bg-white",
              isCollapsed ? "p-2" : "p-4",
            )}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold uppercase text-white shadow-sm"
                  title={`${user?.full_name || "Usuário"} (${user?.role || "Profissional"})`}
                >
                  {getUserInitials(user?.full_name)}
                </div>
                <Button
                  variant="ghost"
                  className="h-8 w-8 rounded-md p-0 flex items-center justify-center text-slate-500 hover:text-slate-900"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 rounded-md p-0 flex items-center justify-center text-slate-500 hover:text-red-600"
                  onClick={onLogout}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-slate-50/50 p-2 border border-slate-100/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold uppercase text-white shadow-sm shrink-0">
                    {getUserInitials(user?.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.full_name || "Usuário"}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {user?.role || "Profissional"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-9 px-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings className="mr-3 h-[18px] w-[18px] shrink-0" />{" "}
                    Configurações
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start text-left h-9 px-3 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-3 h-[18px] w-[18px] shrink-0" /> Sair
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
