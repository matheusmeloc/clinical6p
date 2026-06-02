import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { CalendarDays, Plus, Search, Edit3 } from "lucide-react";
import api from "../lib/api";

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      patient_id: "",
      professional_id: "",
      date: "",
      time: "",
      notes: "",
    },
  });

  const formatDate = (value) =>
    value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : "—";

  const formatTime = (value) => value?.slice(0, 5) || "—";

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return appointments;
    return appointments.filter((a) =>
      [a.patient_name, a.professional_name, a.date, a.time, a.status]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(term)),
    );
  }, [appointments, search]);

  const loadData = async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      const [appointmentsRes, patientsRes, professionalsRes] = await Promise.all([
        api.get("/api/appointments"),
        api.get("/api/patients"),
        api.get("/api/professionals"),
      ]);
      setAppointments(appointmentsRes.data);
      setPatients(patientsRes.data);
      setProfessionals(professionalsRes.data);
    } catch (err) {
      console.error(err);
      setHasLoadError(true);
      toast.error("Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (data) => {
    try {
      const payload = {
        patient_id: Number(data.patient_id),
        professional_id: Number(data.professional_id),
        date: data.date,
        time: data.time,
        observations: data.notes,
      };
      const response = await api.post("/api/appointments", payload);
      setAppointments((current) => [response.data, ...current]);
      reset();
      setDialogOpen(false);
      toast.success("Agendamento criado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail ||
          "Não foi possível criar o agendamento. Verifique os dados.",
      );
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    reset();
  };

  const todayCount = appointments.filter(
    (a) => a.date === today,
  ).length;
  const upcomingCount = appointments.filter((a) => a.status !== "Cancelado").length;
  const nextAppointment =
    appointments.find((a) => new Date(a.date) >= new Date()) || appointments[0];

  const selectClass =
    "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 px-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
            Agendamentos
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Agenda de consultas</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Crie, revise e gerencie os agendamentos de pacientes e profissionais.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Novo agendamento
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
            Agendamentos hoje
          </p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{todayCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Consultas marcadas para hoje.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
            Total agendado
          </p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{upcomingCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Consultas futuras e confirmadas.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
            Próxima consulta
          </p>
          <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {nextAppointment
              ? `${formatDate(nextAppointment.date)} às ${formatTime(nextAppointment.time)}`
              : "—"}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {nextAppointment
              ? `${nextAppointment.patient_name} com ${nextAppointment.professional_name}`
              : "Nenhum agendamento disponível."}
          </p>
        </Card>
      </div>

      {/* Dialog de novo agendamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleClose} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para agendar uma nova consulta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateAppointment)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <select className={selectClass} {...register("patient_id", { required: "Obrigatório" })}>
                <option value="">Selecione um paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.patient_id && <p className="text-xs text-red-600">{errors.patient_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <select className={selectClass} {...register("professional_id", { required: "Obrigatório" })}>
                <option value="">Selecione um profissional</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.professional_id && <p className="text-xs text-red-600">{errors.professional_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" min={today} {...register("date", { required: "Obrigatório" })} />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" {...register("time", { required: "Obrigatório" })} />
              {errors.time && <p className="text-xs text-red-600">{errors.time.message}</p>}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea rows={3} placeholder="Informações adicionais do atendimento" {...register("notes")} />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting ? "Salvando..." : "Agendar consulta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
              Agenda completa
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Próximos agendamentos</h2>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              className="pl-10"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente ou profissional"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Carregando agendamentos...</div>
          ) : hasLoadError ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Erro ao carregar dados.</div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {["Paciente", "Profissional", "Data", "Horário", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">{a.patient_name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{a.professional_name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{formatDate(a.date)}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{formatTime(a.time)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" className="h-9 px-3 text-slate-600 dark:text-slate-300">
                          <Edit3 className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhum agendamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

