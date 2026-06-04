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
import { CalendarDays, Plus, Search, Edit3, Eye, User, Stethoscope, Clock, FileText, MapPin, Wifi } from "lucide-react";
import api from "../lib/api";

const selectClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 px-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [editAppointment, setEditAppointment] = useState(null);
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const createForm = useForm({
    defaultValues: {
      patient_id: "", professional_id: "", date: "", time: "", type: "", status: "Aguardando", notes: "",
    },
  });

  const editForm = useForm();

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

  useEffect(() => { loadData(); }, []);

  // ── Criar ──
  const handleCreate = async (data) => {
    try {
      const payload = {
        patient_id: Number(data.patient_id),
        professional_id: Number(data.professional_id),
        date: data.date,
        time: data.time,
        type: data.type || null,
        status: data.status || "Aguardando",
        observations: data.notes || null,
      };
      const response = await api.post("/api/appointments", payload);
      setAppointments((cur) => [response.data, ...cur]);
      createForm.reset();
      setCreateOpen(false);
      toast.success("Agendamento criado com sucesso!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Não foi possível criar o agendamento.");
    }
  };

  // ── Abrir edição ──
  const handleOpenEdit = (e, appt) => {
    e.stopPropagation();
    editForm.reset({
      patient_id: String(appt.patient_id ?? ""),
      professional_id: String(appt.professional_id ?? ""),
      date: appt.date ?? "",
      time: appt.time?.slice(0, 5) ?? "",
      type: appt.type ?? "",
      status: appt.status ?? "Aguardando",
      notes: appt.observations ?? "",
    });
    setEditAppointment(appt);
  };

  // ── Salvar edição ──
  const handleEdit = async (data) => {
    try {
      const payload = {
        patient_id: Number(data.patient_id),
        professional_id: Number(data.professional_id),
        date: data.date,
        time: data.time,
        type: data.type || null,
        status: data.status,
        observations: data.notes || null,
      };
      const response = await api.put(`/api/appointments/${editAppointment.id}`, payload);
      setAppointments((cur) => cur.map((a) => a.id === editAppointment.id ? response.data : a));
      setEditAppointment(null);
      toast.success("Agendamento atualizado com sucesso!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Não foi possível atualizar o agendamento.");
    }
  };

  // ── Formulário compartilhado ──
  function AppointmentForm({ form, onSubmit, submitLabel, isEdit = false }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Paciente *</Label>
          <select className={selectClass} {...register("patient_id", { required: "Obrigatório" })}>
            <option value="">Selecione um paciente</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.patient_id && <p className="text-xs text-red-600">{errors.patient_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Profissional *</Label>
          <select className={selectClass} {...register("professional_id", { required: "Obrigatório" })}>
            <option value="">Selecione um profissional</option>
            {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.professional_id && <p className="text-xs text-red-600">{errors.professional_id.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Data *</Label>
          <Input type="date" min={isEdit ? undefined : today} {...register("date", { required: "Obrigatório" })} />
          {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Horário *</Label>
          <Input type="time" {...register("time", { required: "Obrigatório" })} />
          {errors.time && <p className="text-xs text-red-600">{errors.time.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de consulta</Label>
          <select className={selectClass} {...register("type")}>
            <option value="">Selecione</option>
            <option value="Primeira Consulta">Primeira Consulta</option>
            <option value="Retorno">Retorno</option>
            <option value="Avaliação">Avaliação</option>
            <option value="Urgência">Urgência</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <select className={selectClass} {...register("status")}>
            <option value="Aguardando">Aguardando</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label>Observações</Label>
          <Textarea rows={3} placeholder="Informações adicionais do atendimento" {...register("notes")} />
        </div>

        <DialogFooter className="sm:col-span-2">
          <Button type="button" variant="secondary"
            onClick={() => { setCreateOpen(false); setEditAppointment(null); }}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? "Salvando..." : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  const todayCount      = appointments.filter((a) => a.date === today).length;
  const upcomingCount   = appointments.filter((a) => a.status !== "Cancelado").length;
  const nextAppointment = appointments.find((a) => new Date(a.date) >= new Date()) || appointments[0];

  const statusStyle = {
    Confirmado: "bg-emerald-100 text-emerald-700",
    Aguardando: "bg-amber-100 text-amber-700",
    Cancelado:  "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  };

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
        <Button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4" /> Novo agendamento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Agendamentos hoje</p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{todayCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Consultas marcadas para hoje.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Total agendado</p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{upcomingCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Consultas futuras e confirmadas.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Próxima consulta</p>
          <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {nextAppointment ? `${formatDate(nextAppointment.date)} às ${formatTime(nextAppointment.time)}` : "—"}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {nextAppointment
              ? `${nextAppointment.patient_name} com ${nextAppointment.professional_name}`
              : "Nenhum agendamento disponível."}
          </p>
        </Card>
      </div>

      {/* Dialog: Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => { setCreateOpen(false); createForm.reset(); }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>Preencha os dados para agendar uma nova consulta.</DialogDescription>
          </DialogHeader>
          <AppointmentForm form={createForm} onSubmit={handleCreate} submitLabel="Agendar consulta" />
        </DialogContent>
      </Dialog>

      {/* Dialog: Visualizar */}
      <Dialog open={!!viewAppointment} onOpenChange={(v) => !v && setViewAppointment(null)}>
        {viewAppointment && (() => {
          const a = viewAppointment;
          const statusStyle = {
            Confirmado: "bg-emerald-100 text-emerald-700",
            Aguardando: "bg-amber-100 text-amber-700",
            Cancelado:  "bg-red-100 text-red-600",
          };
          const modalityIcon = a.care_modality === "Online"
            ? <Wifi className="w-4 h-4" />
            : <MapPin className="w-4 h-4" />;

          const InfoRow = ({ icon: Icon, label, value }) => (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 p-2 shrink-0">
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || "—"}</p>
              </div>
            </div>
          );

          return (
            <DialogContent onClose={() => setViewAppointment(null)} className="max-w-lg">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 pr-8">
                  <div>
                    <DialogTitle>{a.patient_name ?? "Agendamento"}</DialogTitle>
                    <DialogDescription>Detalhes da consulta</DialogDescription>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1 ${statusStyle[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {a.status}
                  </span>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={User}         label="Paciente"      value={a.patient_name} />
                <InfoRow icon={Stethoscope}  label="Profissional"  value={a.professional_name} />
                <InfoRow icon={CalendarDays} label="Data"          value={formatDate(a.date)} />
                <InfoRow icon={Clock}        label="Horário"       value={formatTime(a.time)} />
                <InfoRow icon={FileText}     label="Tipo"          value={a.type} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 p-2 shrink-0">
                    {modalityIcon && <span className="text-slate-500 dark:text-slate-400">{modalityIcon}</span>}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">Modalidade</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{a.care_modality ?? "Presencial"}</p>
                  </div>
                </div>
              </div>

              {a.observations && (
                <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{a.observations}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="secondary" onClick={() => setViewAppointment(null)}>Fechar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { setViewAppointment(null); handleOpenEdit(e, a); }}>
                  <Edit3 className="w-4 h-4 mr-2" /> Editar
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={!!editAppointment} onOpenChange={(v) => !v && setEditAppointment(null)}>
        {editAppointment && (
          <DialogContent onClose={() => setEditAppointment(null)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar agendamento</DialogTitle>
              <DialogDescription>
                {editAppointment.patient_name} · {formatDate(editAppointment.date)} às {formatTime(editAppointment.time)}
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm form={editForm} onSubmit={handleEdit} submitLabel="Salvar alterações" isEdit />
          </DialogContent>
        )}
      </Dialog>

      {/* Tabela */}
      <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Agenda completa</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">Próximos agendamentos</h2>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input className="pl-10" type="search" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente ou profissional" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Carregando agendamentos...</div>
          ) : hasLoadError ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Erro ao carregar dados.</div>
          ) : (
            <table className="min-w-[700px] w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {["Paciente", "Profissional", "Data", "Horário", "Tipo", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((a) => (
                    <tr key={a.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => setViewAppointment(a)}
                      title="Clique para ver detalhes"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{a.patient_name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{a.professional_name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(a.date)}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{formatTime(a.time)}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{a.type ?? "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[a.status] ?? statusStyle.Aguardando}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" className="h-9 px-3 text-slate-600 dark:text-slate-300"
                            onClick={() => setViewAppointment(a)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" className="h-9 px-3 text-slate-600 dark:text-slate-300"
                            onClick={(e) => handleOpenEdit(e, a)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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
