import { useEffect, useMemo, useRef, useState } from "react";
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
import { maskPhone, maskCPF } from "../lib/masks";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Eye,
  BookmarkCheck,
  ClipboardList,
  User,
  Trash2,
} from "lucide-react";
import api from "../lib/api";

const selectClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 px-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

const SectionTitle = ({ children }) => (
  <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1 mt-2">
    {children}
  </p>
);

const InfoRow = ({ label, value }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
      {label}
    </p>
    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
      {value || "—"}
    </p>
  </div>
);

function PatientForm({ form, onSubmit, submitLabel, professionals, onCancel }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const [cepLoading, setCepLoading] = useState(false);
  const cepAbortRef = useRef(null);

  const handleCepChange = async (e) => {
    e.target.value = e.target.value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
    register("address_cep").onChange(e);

    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length !== 8) return;

    if (cepAbortRef.current) cepAbortRef.current.abort();
    const controller = new AbortController();
    cepAbortRef.current = controller;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setValue("address_street", data.logradouro || "");
      setValue("address_neighborhood", data.bairro || "");
      setValue("address_city", data.localidade || "");
      setValue("address_state", data.uf || "");
    } catch (err) {
      if (err.name === "AbortError") return;
      toast.error("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 sm:grid-cols-2"
    >
      <SectionTitle>Dados pessoais</SectionTitle>

      <div className="space-y-1.5">
        <Label>Nome completo *</Label>
        <Input
          placeholder="Nome do paciente"
          {...register("name", { required: "Obrigatório" })}
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>CPF</Label>
        <Input
          placeholder="000.000.000-00"
          maxLength={14}
          {...register("cpf")}
          onChange={(e) => {
            e.target.value = maskCPF(e.target.value);
            register("cpf").onChange(e);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Data de nascimento</Label>
        <Input type="date" {...register("birth_date")} />
      </div>

      <div className="space-y-1.5">
        <Label>Gênero</Label>
        <select className={selectClass} {...register("gender")}>
          <option value="">Selecione</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Não binário">Não binário</option>
          <option value="Prefiro não informar">Prefiro não informar</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Estado civil</Label>
        <select className={selectClass} {...register("marital_status")}>
          <option value="">Selecione</option>
          <option value="Solteiro(a)">Solteiro(a)</option>
          <option value="Casado(a)">Casado(a)</option>
          <option value="Divorciado(a)">Divorciado(a)</option>
          <option value="Viúvo(a)">Viúvo(a)</option>
          <option value="União estável">União estável</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Profissão</Label>
        <Input
          placeholder="Ex: Engenheiro, Professor..."
          {...register("profession")}
        />
      </div>

      <SectionTitle>Contato</SectionTitle>

      <div className="space-y-1.5">
        <Label>Telefone</Label>
        <Input
          placeholder="(11) 99999-0000"
          maxLength={16}
          {...register("phone")}
          onChange={(e) => {
            e.target.value = maskPhone(e.target.value);
            register("phone").onChange(e);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input
          type="email"
          placeholder="paciente@email.com"
          {...register("email")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>CEP</Label>
        <div className="relative">
          <Input
            placeholder="00000-000"
            maxLength={9}
            {...register("address_cep")}
            onChange={handleCepChange}
          />
          {cepLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">
              Buscando...
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cidade / Estado</Label>
        <div className="flex gap-2">
          <Input placeholder="Cidade" {...register("address_city")} />
          <Input
            placeholder="UF"
            maxLength={2}
            className="w-20 uppercase"
            {...register("address_state")}
            onChange={(e) => {
              e.target.value = e.target.value
                .replace(/[^a-zA-Z]/g, "")
                .toUpperCase()
                .slice(0, 2);
              register("address_state").onChange(e);
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bairro</Label>
        <Input placeholder="Bairro" {...register("address_neighborhood")} />
      </div>

      <div className="space-y-1.5">
        <Label>Rua / Avenida</Label>
        <Input placeholder="Nome da rua" {...register("address_street")} />
      </div>

      <div className="space-y-1.5">
        <Label>Número / Complemento</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Nº"
            className="w-24"
            {...register("address_number")}
          />
          <Input
            placeholder="Apto, Bloco..."
            {...register("address_complement")}
          />
        </div>
      </div>

      <SectionTitle>Atendimento</SectionTitle>

      <div className="space-y-1.5">
        <Label>Profissional responsável</Label>
        <select className={selectClass} {...register("professional_id")}>
          <option value="">Sem responsável</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Tipo de atendimento</Label>
        <select className={selectClass} {...register("attendance_type")}>
          <option value="Particular">Particular</option>
          <option value="Convênio">Convênio</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Plano de saúde</Label>
        <Input
          placeholder="Ex: Unimed, Amil..."
          {...register("insurance_plan")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Número do convênio</Label>
        <Input
          placeholder="Número da carteirinha"
          {...register("insurance_number")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Modalidade</Label>
        <select className={selectClass} {...register("care_modality")}>
          <option value="Presencial">Presencial</option>
          <option value="Online">Online</option>
          <option value="Híbrido">Híbrido</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <select className={selectClass} {...register("status")}>
          <option value="Ativo">Ativo</option>
          <option value="Aguardando">Aguardando</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <Label>Observações</Label>
        <Textarea
          rows={3}
          placeholder="Informações adicionais..."
          {...register("observations")}
        />
      </div>

      <SectionTitle>Acesso ao portal</SectionTitle>

      <div className="sm:col-span-2 space-y-1.5">
        <Label>Nova senha de acesso</Label>
        <Input
          type="password"
          placeholder="Deixe em branco para não alterar"
          {...register("password")}
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Usa o CPF como login no portal do paciente.
        </p>
      </div>

      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PacientesPage() {
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [viewTab, setViewTab] = useState("info");
  const [patientMessages, setPatientMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [anamnesisEntries, setAnamnesisEntries] = useState([]);
  const [anamnesisLoading, setAnamnesisLoading] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState({ question: "", answer: "" });
  const [anamnesisAdding, setAnamnesisAdding] = useState(false);
  const [showAnamnesisForm, setShowAnamnesisForm] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

  const createForm = useForm({
    defaultValues: {
      name: "",
      cpf: "",
      birth_date: "",
      gender: "",
      marital_status: "",
      profession: "",
      phone: "",
      email: "",
      address_cep: "",
      address_street: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      attendance_type: "Particular",
      insurance_plan: "",
      insurance_number: "",
      professional_id: "",
      status: "Ativo",
      care_modality: "Presencial",
      observations: "",
      password: "",
    },
  });

  const editForm = useForm();

  const formatDate = (value) => {
    if (!value) return "—";
    const iso = value.includes("T") ? value : value + "T00:00:00";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const formatCPF = (cpf) => {
    if (!cpf) return "—";
    const d = cpf.replace(/\D/g, "");
    return d.length === 11
      ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
      : cpf;
  };

  const formatCEP = (cep) => {
    if (!cep) return "";
    const d = cep.replace(/\D/g, "");
    return d.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setHasLoadError(false);
      try {
        const [patientsRes, prosRes] = await Promise.all([
          api.get("/api/patients"),
          api.get("/api/professionals"),
        ]);
        setPatients(patientsRes.data);
        setProfessionals(prosRes.data);
      } catch (err) {
        console.error(err);
        setHasLoadError(true);
        toast.error("Não foi possível carregar os pacientes.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) =>
      [p.name, p.cpf, p.status, p.email, p.phone]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(term)),
    );
  }, [patients, search]);

  const activeCount = patients.filter(
    (p) => p.status?.toLowerCase() === "ativo",
  ).length;
  const totalCount = patients.length;
  const waitingCount = patients.filter(
    (p) => p.status?.toLowerCase() === "aguardando",
  ).length;

  const handleOpenView = async (patient) => {
    setViewPatient(patient);
    setViewTab("info");
    setPatientMessages([]);
    setAnamnesisEntries([]);
    setShowAnamnesisForm(false);
    setAnamnesisForm({ question: "", answer: "" });
    setSummary(null);
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await api.post(`/api/patients/${viewPatient.id}/summary`);
      setSummary(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao gerar resumo.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadPatientMessages = async (patientId) => {
    setMessagesLoading(true);
    try {
      const res = await api.get(
        `/api/patients/${patientId}/messages?saved_only=true`,
      );
      setPatientMessages(res.data);
    } catch {
      toast.error("Não foi possível carregar as mensagens salvas.");
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadAnamnesis = async (patientId) => {
    setAnamnesisLoading(true);
    try {
      const res = await api.get(`/api/patients/${patientId}/anamnesis`);
      setAnamnesisEntries(res.data);
    } catch {
      toast.error("Não foi possível carregar a anamnese.");
    } finally {
      setAnamnesisLoading(false);
    }
  };

  const handleAddAnamnesis = async (e) => {
    e.preventDefault();
    if (!anamnesisForm.question.trim()) return;
    setAnamnesisAdding(true);
    try {
      const res = await api.post(`/api/patients/${viewPatient.id}/anamnesis`, {
        question: anamnesisForm.question,
        answer: anamnesisForm.answer,
      });
      setAnamnesisEntries((cur) => [...cur, res.data]);
      setAnamnesisForm({ question: "", answer: "" });
      setShowAnamnesisForm(false);
    } catch {
      toast.error("Não foi possível salvar a questão.");
    } finally {
      setAnamnesisAdding(false);
    }
  };

  const handleDeleteAnamnesis = async (entryId) => {
    try {
      await api.delete(`/api/patients/anamnesis/${entryId}`);
      setAnamnesisEntries((cur) => cur.filter((e) => e.id !== entryId));
    } catch {
      toast.error("Não foi possível remover a questão.");
    }
  };

  const handleUnsaveMessage = async (messageId) => {
    try {
      await api.put(`/api/patient-messages/${messageId}/unsave`);
      setPatientMessages((cur) => cur.filter((m) => m.id !== messageId));
      toast.success("Mensagem removida do card do paciente.");
    } catch {
      toast.error("Não foi possível remover a mensagem.");
    }
  };

  const handleCreate = async (data) => {
    try {
      const payload = buildPayload(data);
      const response = await api.post("/api/patients", payload);
      setPatients((cur) => [response.data, ...cur]);
      createForm.reset();
      setCreateOpen(false);
      const emailSent = payload.email && payload.cpf;
      toast.success("Paciente cadastrado com sucesso!");
      if (emailSent) {
        toast("Credenciais de acesso enviadas para o e-mail do paciente.", {
          icon: "📧",
          duration: 5000,
        });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (
        detail.toLowerCase().includes("cpf") ||
        detail.toLowerCase().includes("unique")
      ) {
        toast.error("Este CPF já está cadastrado.");
      } else {
        toast.error(detail || "Não foi possível cadastrar o paciente.");
      }
    }
  };

  const handleOpenEdit = (e, patient) => {
    e.stopPropagation();
    editForm.reset({
      name: patient.name || "",
      cpf: formatCPF(patient.cpf) === "—" ? "" : formatCPF(patient.cpf),
      birth_date: patient.birth_date || "",
      gender: patient.gender || "",
      marital_status: patient.marital_status || "",
      profession: patient.profession || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address_cep: formatCEP(patient.address_cep),
      address_street: patient.address_street || "",
      address_number: patient.address_number || "",
      address_complement: patient.address_complement || "",
      address_neighborhood: patient.address_neighborhood || "",
      address_city: patient.address_city || "",
      address_state: patient.address_state || "",
      attendance_type: patient.attendance_type || "Particular",
      insurance_plan: patient.insurance_plan || "",
      insurance_number: patient.insurance_number || "",
      professional_id: patient.professional_id || "",
      status: patient.status || "Ativo",
      care_modality: patient.care_modality || "Presencial",
      observations: patient.observations || "",
      password: "",
    });
    setEditPatient(patient);
  };

  const handleEdit = async (data) => {
    try {
      const payload = buildPayload(data);
      const response = await api.put(
        `/api/patients/${editPatient.id}`,
        payload,
      );
      setPatients((cur) =>
        cur.map((p) => (p.id === editPatient.id ? response.data : p)),
      );
      setEditPatient(null);
      toast.success("Paciente atualizado com sucesso!");
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Não foi possível atualizar o paciente.",
      );
    }
  };

  function buildPayload(data) {
    return {
      name: data.name,
      cpf: data.cpf ? data.cpf.replace(/\D/g, "") || null : null,
      birth_date: data.birth_date || null,
      gender: data.gender || null,
      marital_status: data.marital_status || null,
      profession: data.profession || null,
      phone: data.phone || null,
      email: data.email || null,
      address_cep: data.address_cep || null,
      address_street: data.address_street || null,
      address_number: data.address_number || null,
      address_complement: data.address_complement || null,
      address_neighborhood: data.address_neighborhood || null,
      address_city: data.address_city || null,
      address_state: data.address_state || null,
      attendance_type: data.attendance_type || "Particular",
      insurance_plan: data.insurance_plan || null,
      insurance_number: data.insurance_number || null,
      professional_id: data.professional_id
        ? Number(data.professional_id)
        : null,
      status: data.status || "Ativo",
      care_modality: data.care_modality || "Presencial",
      observations: data.observations || null,
      password: data.password || null,
    };
  }

  return (
    <div className="space-y-6">
      {/* ── Stats + Ações rápidas ── */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                Pacientes
              </p>
              <h2 className="mt-3 text-2xl font-bold">Gestão de pacientes</h2>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 space-y-4 text-slate-700 dark:text-slate-300">
            <p>
              Veja o status dos pacientes, acompanhe a última visita e gerencie
              o atendimento.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Pacientes ativos", value: activeCount },
                { label: "Total de pacientes", value: totalCount },
                { label: "Aguardando atendimento", value: waitingCount },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5"
                >
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                Ações rápidas
              </p>
              <h2 className="mt-3 text-2xl font-bold">Atalhos</h2>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-700 p-3 text-slate-700 dark:text-slate-300">
              <Plus className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8">
            <Button
              onClick={() => setCreateOpen(true)}
              className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" /> Cadastrar novo paciente
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Dialog: Cadastrar ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          onClose={() => {
            setCreateOpen(false);
            createForm.reset();
          }}
          className="max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle>Novo paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados. Apenas o nome é obrigatório.
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            form={createForm}
            onSubmit={handleCreate}
            submitLabel="Cadastrar paciente"
            professionals={professionals}
            onCancel={() => {
              setCreateOpen(false);
              createForm.reset();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Visualizar (com abas) ── */}
      <Dialog
        open={!!viewPatient}
        onOpenChange={(v) => !v && setViewPatient(null)}
      >
        {viewPatient && (
          <DialogContent
            onClose={() => setViewPatient(null)}
            className="max-w-2xl"
          >
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-8">
                <div>
                  <DialogTitle>{viewPatient.name}</DialogTitle>
                  <DialogDescription>
                    Ficha completa do paciente
                  </DialogDescription>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1 ${
                    viewPatient.status === "Ativo"
                      ? "bg-emerald-100 text-emerald-700"
                      : viewPatient.status === "Aguardando"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {viewPatient.status ?? "Ativo"}
                </span>
              </div>
            </DialogHeader>

            {/* Abas */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 -mx-6 px-6">
              {[
                { key: "info", label: "Informações", icon: User },
                {
                  key: "messages",
                  label: "Mensagens salvas",
                  icon: BookmarkCheck,
                },
                { key: "anamnese", label: "Anamnese", icon: ClipboardList },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setViewTab(key);
                    if (key === "messages" && patientMessages.length === 0) {
                      loadPatientMessages(viewPatient.id);
                    }
                    if (key === "anamnese" && anamnesisEntries.length === 0) {
                      loadAnamnesis(viewPatient.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    viewTab === key
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Conteúdo da aba */}
            <div className="min-h-[200px] mt-5">
              {/* Aba: Informações */}
              {viewTab === "info" && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1 mb-3">
                      Dados pessoais
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoRow label="CPF" value={formatCPF(viewPatient.cpf)} />
                      <InfoRow
                        label="Data de nascimento"
                        value={formatDate(viewPatient.birth_date)}
                      />
                      <InfoRow label="Gênero" value={viewPatient.gender} />
                      <InfoRow
                        label="Estado civil"
                        value={viewPatient.marital_status}
                      />
                      <InfoRow
                        label="Profissão"
                        value={viewPatient.profession}
                      />
                      <InfoRow
                        label="Cadastro"
                        value={formatDate(viewPatient.created_at)}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1 mb-3">
                      Contato
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoRow label="Telefone" value={viewPatient.phone} />
                      <InfoRow label="E-mail" value={viewPatient.email} />
                      <InfoRow label="CEP" value={formatCEP(viewPatient.address_cep) || viewPatient.address_cep} />
                      <InfoRow
                        label="Cidade / UF"
                        value={[
                          viewPatient.address_city,
                          viewPatient.address_state,
                        ]
                          .filter(Boolean)
                          .join(" / ")}
                      />
                      <InfoRow label="Bairro" value={viewPatient.address_neighborhood} />
                      <InfoRow label="Rua" value={viewPatient.address_street} />
                      <InfoRow
                        label="Número"
                        value={viewPatient.address_number}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1 mb-3">
                      Atendimento
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <InfoRow
                        label="Profissional"
                        value={viewPatient.professional_name}
                      />
                      <InfoRow
                        label="Tipo"
                        value={viewPatient.attendance_type}
                      />
                      <InfoRow
                        label="Modalidade"
                        value={viewPatient.care_modality}
                      />
                      <InfoRow
                        label="Plano de saúde"
                        value={viewPatient.insurance_plan}
                      />
                      <InfoRow
                        label="Nº convênio"
                        value={viewPatient.insurance_number}
                      />
                    </div>
                    {viewPatient.observations && (
                      <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3">
                        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                          Observações
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {viewPatient.observations}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba: Mensagens salvas */}
              {viewTab === "messages" && (
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse">
                      Carregando mensagens...
                    </div>
                  ) : patientMessages.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                      Nenhuma mensagem salva para este paciente.
                    </div>
                  ) : (
                    <>
                      <div
                        className="space-y-3 overflow-y-auto pr-1"
                        style={{ maxHeight: patientMessages.length > 4 ? "240px" : "none" }}
                      >
                        {patientMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4 space-y-2"
                          >
                            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                              {msg.message}
                            </p>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                                <span>{formatDateTime(msg.created_at)}</span>
                                {msg.is_read ? (
                                  <span className="text-emerald-600 font-medium">Lida</span>
                                ) : (
                                  <span className="text-amber-500 font-medium">Não lida</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleUnsaveMessage(msg.id)}
                                className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1 shrink-0"
                              >
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                Remover
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {!summary && (
                        <button
                          onClick={handleGenerateSummary}
                          disabled={summaryLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                        >
                          {summaryLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                              </svg>
                              Gerando resumo...
                            </>
                          ) : (
                            <>✨ Gerar resumo com IA</>
                          )}
                        </button>
                      )}

                      {summary && (
                        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                              ✨ Resumo com IA
                              <span className="text-slate-400 dark:text-slate-500 font-normal normal-case tracking-normal">
                                · {summary.messages_count} mensagem{summary.messages_count !== 1 ? "s" : ""} analisada{summary.messages_count !== 1 ? "s" : ""}
                              </span>
                            </p>
                            <button
                              onClick={() => setSummary(null)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              title="Fechar resumo"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {summary.summary}
                          </p>
                          <button
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
                          >
                            Regenerar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Aba: Anamnese */}
              {viewTab === "anamnese" && (
                <div className="flex flex-col gap-4">
                  {anamnesisLoading ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm animate-pulse">
                      Carregando anamnese...
                    </div>
                  ) : (
                    <>
                      {anamnesisEntries.length > 0 && (
                        <div
                          className="space-y-3 overflow-y-auto pr-1"
                          style={{ maxHeight: anamnesisEntries.length > 5 ? "300px" : "none" }}
                        >
                          {anamnesisEntries.map((entry, index) => (
                            <div
                              key={entry.id}
                              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                                  {index + 1}. {entry.question}
                                </p>
                                <button
                                  onClick={() => handleDeleteAnamnesis(entry.id)}
                                  className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                  title="Remover questão"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {entry.answer ? (
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {entry.answer}
                                </p>
                              ) : (
                                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                                  Sem resposta registrada.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {anamnesisEntries.length === 0 && !showAnamnesisForm && (
                        <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                          Nenhuma questão registrada. Clique em "Adicionar questão" para começar.
                        </div>
                      )}

                      {showAnamnesisForm && (
                        <form onSubmit={handleAddAnamnesis} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Pergunta *
                            </label>
                            <input
                              type="text"
                              value={anamnesisForm.question}
                              onChange={(e) => setAnamnesisForm((f) => ({ ...f, question: e.target.value }))}
                              placeholder="Ex: Possui histórico de depressão?"
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              required
                              autoFocus
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                              Resposta
                            </label>
                            <textarea
                              value={anamnesisForm.answer}
                              onChange={(e) => setAnamnesisForm((f) => ({ ...f, answer: e.target.value }))}
                              placeholder="Resposta do paciente..."
                              rows={3}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setShowAnamnesisForm(false); setAnamnesisForm({ question: "", answer: "" }); }}
                              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={anamnesisAdding}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                              {anamnesisAdding ? "Salvando..." : "Salvar"}
                            </button>
                          </div>
                        </form>
                      )}

                      {!showAnamnesisForm && (
                        <button
                          onClick={() => setShowAnamnesisForm(true)}
                          className="flex items-center gap-2 self-start px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar questão
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setViewPatient(null)}>
                Fechar
              </Button>
              {viewTab === "info" && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={(e) => {
                    const p = viewPatient;
                    setViewPatient(null);
                    handleOpenEdit(e, p);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Editar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Dialog: Editar ── */}
      <Dialog
        open={!!editPatient}
        onOpenChange={(v) => !v && setEditPatient(null)}
      >
        {editPatient && (
          <DialogContent
            onClose={() => setEditPatient(null)}
            className="max-w-3xl"
          >
            <DialogHeader>
              <DialogTitle>Editar paciente</DialogTitle>
              <DialogDescription>
                Atualize os dados de {editPatient.name}.
              </DialogDescription>
            </DialogHeader>
            <PatientForm
              form={editForm}
              onSubmit={handleEdit}
              submitLabel="Salvar alterações"
              professionals={professionals}
              onCancel={() => setEditPatient(null)}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* ── Tabela ── */}
      <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
              Lista de pacientes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Registros recentes</h2>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou status"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Carregando pacientes...
            </div>
          ) : hasLoadError ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Erro ao carregar dados.
            </div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {[
                    "Nome",
                    "CPF",
                    "Telefone",
                    "Profissional",
                    "Modalidade",
                    "Status",
                    "Cadastro",
                    "Ações",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => handleOpenView(p)}
                      title="Clique para ver detalhes"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {p.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatCPF(p.cpf)}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.phone ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.professional_name ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {p.care_modality ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            p.status === "Ativo"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.status === "Aguardando"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {p.status ?? "Ativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td
                        className="px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="h-9 px-3 text-slate-600 dark:text-slate-300"
                            onClick={() => handleOpenView(p)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-9 px-3 text-slate-600 dark:text-slate-300"
                            onClick={(e) => handleOpenEdit(e, p)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Nenhum paciente encontrado.
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
