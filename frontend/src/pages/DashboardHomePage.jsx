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
} from "lucide-react";
import api from "../lib/api";

const StatCard = ({ label, value, loading }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-5 bg-slate-50 dark:bg-slate-700/50">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, msgsRes, apptRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/patient-messages/unread"),
          api.get("/api/appointments?limit=300"),
        ]);
        setStats(statsRes.data);
        setAppointments(apptRes.data ?? []);
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
          next_appointment: "—",
        });
        setUnreadMessages("—");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Esquerda: Calendário */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                Agenda
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Calendário de consultas
              </h2>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <AppointmentCalendar appointments={appointments} />
        </Card>

        {/* Direita: Ações rápidas + Status geral */}
        <div className="space-y-6">
          {/* Ações rápidas */}
          <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                  Ações rápidas
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Acesso imediato
                </h2>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/agendamentos")}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 text-left hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ver agenda</p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">Próximas consultas</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/pacientes")}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 text-left hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gerenciar</p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">Pacientes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/mensagens")}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 text-left hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Caixa de entrada</p>
                    <p className="mt-0.5 text-base font-semibold text-slate-900 dark:text-slate-100">Mensagens de pacientes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              </Button>
            </div>
          </Card>

          {/* Status geral (substituiu Dados do usuário) */}
          <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                  Status geral
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Fluxo atual
                </h2>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatCard label="Consultas hoje"        value={stats?.appointments_today} loading={loading} />
              <StatCard label="Consultas esta semana" value={stats?.appointments_week}  loading={loading} />
              <StatCard label="Total de pacientes"    value={stats?.total_patients}     loading={loading} />
              <StatCard label="Mensagens não lidas"   value={unreadMessages}            loading={loading} />
            </div>

            {!loading && stats?.next_appointment && stats.next_appointment !== "N/A" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                <Clock className="w-4 h-4 shrink-0" />
                Próxima consulta às <strong>{stats.next_appointment}</strong>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
