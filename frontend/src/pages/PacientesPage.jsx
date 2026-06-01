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
import { maskPhone, maskCPF } from "../lib/masks";
import { Users, Plus, Search, Edit3 } from "lucide-react";
import api from "../lib/api";

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

const SectionTitle = ({ children }) => (
  <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mt-2">
    {children}
  </p>
);

export default function PacientesPage() {
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
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

  const formatDate = (value) =>
    value ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR") : "—";

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

  const activeCount = patients.filter((p) => p.status?.toLowerCase() === "ativo").length;
  const totalCount = patients.length;
  const waitingCount = patients.filter((p) => p.status?.toLowerCase() === "aguardando").length;

  const handleCreate = async (data) => {
    try {
      const payload = {
        name: data.name,
        cpf: data.cpf ? data.cpf.replace(/\D/g, "") : null,
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
        professional_id: data.professional_id ? Number(data.professional_id) : null,
        status: data.status || "Ativo",
        care_modality: data.care_modality || "Presencial",
        observations: data.observations || null,
        password: data.password || null,
      };
      const response = await api.post("/api/patients", payload);
      setPatients((current) => [response.data, ...current]);
      reset();
      setDialogOpen(false);
      toast.success("Paciente cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "";
      if (detail.toLowerCase().includes("cpf") || detail.toLowerCase().includes("unique")) {
        toast.error("Este CPF já está cadastrado no sistema.");
      } else {
        toast.error(detail || "Não foi possível cadastrar o paciente.");
      }
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="bg-white/90 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                Pacientes
              </p>
              <h2 className="mt-3 text-2xl font-bold">Gestão de pacientes</h2>
            </div>
            <div className="rounded-3xl bg-emerald-100 p-3 text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4 text-slate-700">
            <p>
              Veja o status dos pacientes, acompanhe a última visita e gerencie
              o atendimento de forma rápida.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Pacientes ativos</p>
                <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Total de pacientes</p>
                <p className="mt-3 text-3xl font-semibold">{totalCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Aguardando atendimento</p>
                <p className="mt-3 text-3xl font-semibold">{waitingCount}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/90 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                Ações rápidas
              </p>
              <h2 className="mt-3 text-2xl font-bold">Atalhos</h2>
            </div>
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-700">
              <Plus className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Cadastrar novo paciente
            </Button>
          </div>
        </Card>
      </div>

      {/* Dialog de cadastro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleClose} className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo paciente</DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente. Apenas o nome é obrigatório.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreate)} className="grid gap-4 sm:grid-cols-2">

            {/* ── Dados pessoais ── */}
            <SectionTitle>Dados pessoais</SectionTitle>

            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input
                placeholder="Nome do paciente"
                {...register("name", { required: "Nome obrigatório" })}
              />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
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
              <Input placeholder="Ex: Engenheiro, Professor..." {...register("profession")} />
            </div>

            {/* ── Contato ── */}
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
              <Input type="email" placeholder="paciente@email.com" {...register("email")} />
            </div>

            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                maxLength={9}
                {...register("address_cep")}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0,9);
                  register("address_cep").onChange(e);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Cidade / Estado</Label>
              <div className="flex gap-2">
                <Input placeholder="Cidade" {...register("address_city")} />
                <Input placeholder="UF" maxLength={2} className="w-20 uppercase"
                  {...register("address_state")}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0,2);
                    register("address_state").onChange(e);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Rua / Avenida</Label>
              <Input placeholder="Nome da rua" {...register("address_street")} />
            </div>

            <div className="space-y-1.5">
              <Label>Número / Complemento</Label>
              <div className="flex gap-2">
                <Input placeholder="Nº" className="w-24" {...register("address_number")} />
                <Input placeholder="Apto, Bloco..." {...register("address_complement")} />
              </div>
            </div>

            {/* ── Atendimento ── */}
            <SectionTitle>Atendimento</SectionTitle>

            <div className="space-y-1.5">
              <Label>Profissional responsável</Label>
              <select className={selectClass} {...register("professional_id")}>
                <option value="">Sem responsável</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
              <Input placeholder="Ex: Unimed, Amil..." {...register("insurance_plan")} />
            </div>

            <div className="space-y-1.5">
              <Label>Número do convênio</Label>
              <Input placeholder="Número da carteirinha" {...register("insurance_number")} />
            </div>

            <div className="space-y-1.5">
              <Label>Modalidade de cuidado</Label>
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
                placeholder="Informações adicionais sobre o paciente..."
                {...register("observations")}
              />
            </div>

            {/* ── Acesso ao portal ── */}
            <SectionTitle>Acesso ao portal do paciente</SectionTitle>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Senha de acesso</Label>
              <Input
                type="password"
                placeholder="Deixe em branco para não habilitar acesso"
                {...register("password")}
              />
              <p className="text-xs text-slate-400">
                Se preenchida, o paciente poderá enviar mensagens pelo portal usando o CPF como login.
              </p>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? "Salvando..." : "Cadastrar paciente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabela */}
      <Card className="bg-white/90 border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
              Lista de pacientes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Registros recentes</h2>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou status"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando pacientes...</div>
          ) : hasLoadError ? (
            <div className="p-8 text-center text-slate-500">Erro ao carregar dados.</div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Nome", "CPF", "Telefone", "Profissional", "Modalidade", "Status", "Cadastro", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{p.cpf ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{p.professional_name ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{p.care_modality ?? "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          p.status === "Ativo"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "Aguardando"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {p.status ?? "Ativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" className="h-9 px-3 text-slate-600">
                          <Edit3 className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
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

