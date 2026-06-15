import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import AppointmentCalendar from "../components/AppointmentCalendar";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "../lib/api";

const StatCard = ({ label, value, loading }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-5 bg-slate-50 dark:bg-slate-700/50 flex flex-col">
    <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[2.5rem] leading-tight">{label}</p>
    <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
      {loading ? (
        <span className="text-slate-300 dark:text-slate-600 animate-pulse">—</span>
      ) : (
        value
      )}
    </p>
  </div>
);

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, msgsRes, apptRes, recentMsgsRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/patient-messages/unread"),
          api.get("/api/appointments?limit=300"),
          api.get("/api/patient-messages"),
        ]);
        setStats(statsRes.data);
        setAppointments(apptRes.data ?? []);
        setRecentMessages((recentMsgsRes.data ?? []).slice(0, 5));
        setUnreadMessages(
          typeof msgsRes.data === "number"
            ? msgsRes.data
            : (msgsRes.data?.count ?? msgsRes.data?.length ?? 0),
        );
      } catch {
        setStats({
          total_patients: "—",
          appointments_today: "—",
          appointments_week: "—",
          next_appointment: null,
        });
        setUnreadMessages("—");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const msgCard = (
    <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Caixa de entrada</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Mensagens recentes</h2>
        </div>
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
          <MessageSquare className="w-6 h-6" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 animate-pulse">Carregando...</p>
      ) : recentMessages.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nenhuma mensagem recebida.</p>
      ) : (
        <div className="space-y-3">
          {recentMessages.map((msg) => {
            const [y, m, d] = (msg.created_at?.split("T")[0] || "").split("-");
            const dateStr = d ? `${d}/${m}/${y}` : "—";
            const timeStr = msg.created_at
              ? new Date(msg.created_at.endsWith("Z") ? msg.created_at : msg.created_at + "Z")
                  .toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "";
            return (
              <div
                key={msg.id}
                onClick={() => navigate("/mensagens")}
                className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${msg.is_read ? "bg-slate-300 dark:bg-slate-600" : "bg-amber-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{msg.patient_name || "Paciente"}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{dateStr} {timeStr}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{msg.message}</p>
                </div>
                {msg.is_read && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />}
              </div>
            );
          })}
        </div>
      )}

      <Button
        variant="ghost"
        onClick={() => navigate("/mensagens")}
        className="mt-4 w-full justify-between border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
      >
        Ver todas as mensagens <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  );

  const fluxoCard = (
    <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Status geral</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Fluxo atual</h2>
        </div>
        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
          <CalendarDays className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-2">
        <StatCard label="Consultas hoje"        value={stats?.appointments_today} loading={loading} />
        <StatCard label="Consultas esta semana" value={stats?.appointments_week}  loading={loading} />
        <StatCard label="Total de pacientes"    value={stats?.total_patients}     loading={loading} />
        <StatCard label="Mensagens não lidas"   value={unreadMessages}            loading={loading} />
      </div>

      {!loading && stats?.next_appointment && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Próxima consulta: <strong>
              {(() => { const [y,m,d] = (stats.next_appointment.date || "").split("-"); return d ? `${d}/${m}/${y}` : "—"; })()} às {stats.next_appointment.time}
            </strong>
            {stats.next_appointment.patient_name && (
              <> · {stats.next_appointment.patient_name}{stats.next_appointment.professional_name && <> com {stats.next_appointment.professional_name}</>}</>
            )}
          </span>
        </div>
      )}
    </Card>
  );

  return (
    <>
      {/* Mobile: Calendário → Acesso → Mensagens → Fluxo */}
      <div className="flex flex-col gap-6 xl:hidden">

        {/* Calendário */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Agenda</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Calendário de consultas</h2>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><CalendarDays className="w-6 h-6" /></div>
          </div>
          <AppointmentCalendar appointments={appointments} />
        </Card>

        {/* Acesso imediato */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Ações rápidas</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Acesso imediato</h2>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><ClipboardList className="w-6 h-6" /></div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { path: "/agendamentos", icon: <CalendarDays className="w-5 h-5 text-emerald-600 shrink-0" />, sub: "Ver agenda", label: "Próximas consultas" },
              { path: "/pacientes",    icon: <Users className="w-5 h-5 text-blue-600 shrink-0" />,          sub: "Gerenciar",  label: "Pacientes" },
              { path: "/mensagens",   icon: <MessageSquare className="w-5 h-5 text-amber-600 shrink-0" />,  sub: "Caixa de entrada", label: "Mensagens de pacientes" },
            ].map(({ path, icon, sub, label }) => (
              <Button key={path} variant="ghost" onClick={() => navigate(path)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 text-left hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 h-auto justify-between">
                <div className="flex items-center gap-3">
                  {icon}
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              </Button>
            ))}
          </div>
        </Card>

        {msgCard}
        {fluxoCard}
      </div>

      {/* Desktop xl: grid 2 colunas */}
      <div className="hidden xl:grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Coluna esquerda */}
        <div className="space-y-6">
          <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Agenda</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Calendário de consultas</h2>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><CalendarDays className="w-6 h-6" /></div>
            </div>
            <AppointmentCalendar appointments={appointments} />
          </Card>
          {msgCard}
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Ações rápidas</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Acesso imediato</h2>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700"><ClipboardList className="w-6 h-6" /></div>
            </div>
            <div className="mt-8 space-y-4">
              {[
                { path: "/agendamentos", icon: <CalendarDays className="w-5 h-5 text-emerald-600 shrink-0" />, sub: "Ver agenda", label: "Próximas consultas" },
                { path: "/pacientes",    icon: <Users className="w-5 h-5 text-blue-600 shrink-0" />,          sub: "Gerenciar",  label: "Pacientes" },
                { path: "/mensagens",   icon: <MessageSquare className="w-5 h-5 text-amber-600 shrink-0" />,  sub: "Caixa de entrada", label: "Mensagens de pacientes" },
              ].map(({ path, icon, sub, label }) => (
                <Button key={path} variant="ghost" onClick={() => navigate(path)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 text-left hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 h-auto justify-between">
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>
                      <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                </Button>
              ))}
            </div>
          </Card>
          {fluxoCard}
        </div>
      </div>
    </>
  );
}
