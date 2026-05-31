import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  UserCheck,
  Users,
  MessageSquare,
  Clock,
} from "lucide-react";
import api from "../lib/api";

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const StatCard = ({ label, value, loading }) => (
  <div className="rounded-3xl border border-slate-200 p-5 bg-slate-50">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold">
      {loading ? <span className="text-slate-300 animate-pulse">—</span> : value}
    </p>
  </div>
);

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const [stats, setStats] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, msgsRes] = await Promise.all([
          api.get("/api/dashboard/stats"),
          api.get("/api/patient-messages/unread"),
        ]);
        setStats(statsRes.data);
        setUnreadMessages(
          typeof msgsRes.data === "number"
            ? msgsRes.data
            : msgsRes.data?.count ?? msgsRes.data?.length ?? 0,
        );
      } catch {
        setStats({ total_patients: "—", appointments_today: "—", appointments_week: "—", next_appointment: "—" });
        setUnreadMessages("—");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/40">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
          Visão geral
        </p>
        <h2 className="mt-3 text-3xl font-bold">Resumo do painel</h2>
        <p className="mt-3 text-slate-500 text-sm leading-relaxed">
          Aqui você encontra os principais indicadores e os próximos passos para
          administrar a clínica.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Card de stats */}
        <Card className="bg-white/90 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                Status geral
              </p>
              <h2 className="mt-3 text-2xl font-bold">Fluxo atual</h2>
            </div>
            <div className="rounded-3xl bg-emerald-100 p-3 text-emerald-700">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Consultas hoje"
              value={stats?.appointments_today}
              loading={loading}
            />
            <StatCard
              label="Consultas esta semana"
              value={stats?.appointments_week}
              loading={loading}
            />
            <StatCard
              label="Total de pacientes"
              value={stats?.total_patients}
              loading={loading}
            />
            <StatCard
              label="Mensagens não lidas"
              value={unreadMessages}
              loading={loading}
            />
          </div>

          {!loading && stats?.next_appointment && stats.next_appointment !== "N/A" && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <Clock className="w-4 h-4 shrink-0" />
              Próxima consulta às <strong>{stats.next_appointment}</strong>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Ações rápidas */}
          <Card className="bg-white/90 border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                  Ações rápidas
                </p>
                <h2 className="mt-3 text-2xl font-bold">Acesso imediato</h2>
              </div>
              <div className="rounded-3xl bg-blue-100 p-3 text-blue-700">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/agendamentos")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-slate-100 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500">Ver agenda</p>
                    <p className="mt-0.5 text-base font-semibold">Próximas consultas</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/pacientes")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-slate-100 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500">Gerenciar</p>
                    <p className="mt-0.5 text-base font-semibold">Pacientes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => navigate("/mensagens")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-slate-100 h-auto justify-between"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500">Caixa de entrada</p>
                    <p className="mt-0.5 text-base font-semibold">Mensagens de pacientes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 shrink-0" />
              </Button>
            </div>
          </Card>

          {/* Perfil */}
          <Card className="bg-white/90 border border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                  Perfil
                </p>
                <h2 className="mt-3 text-2xl font-bold">Dados do usuário</h2>
              </div>
              <div className="rounded-3xl bg-emerald-100 p-3 text-emerald-700">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-8 space-y-3 text-slate-700">
              <p>
                <span className="font-semibold">Nome:</span>{" "}
                {user?.full_name ?? "—"}
              </p>
              <p>
                <span className="font-semibold">E-mail:</span>{" "}
                {user?.email ?? "—"}
              </p>
              <p>
                <span className="font-semibold">Perfil:</span>{" "}
                {user?.role === "admin" ? "Administrador" : user?.role === "patient" ? "Paciente" : "Profissional"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
