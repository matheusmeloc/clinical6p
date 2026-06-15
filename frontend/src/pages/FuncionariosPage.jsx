import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { maskPhone, maskRegister } from "../lib/masks";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Users, Plus, Search, Edit3 } from "lucide-react";
import api from "../lib/api";

const selectClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 px-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

const SectionTitle = ({ children }) => (
  <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 pb-1 mt-2">
    {children}
  </p>
);

// ── Formulário de profissional — definido FORA do componente pai ─────────────
function ProfessionalForm({ form, onSubmit, submitLabel, isEdit = false, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <SectionTitle>Dados profissionais</SectionTitle>

      <div className="space-y-1.5">
        <Label>Nome completo *</Label>
        <Input
          placeholder="Ex: Dra. Ana Lima"
          {...register("name", { required: "Nome obrigatório" })}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Função / Cargo *</Label>
        <Input
          placeholder="Ex: Psicóloga, Psiquiatra"
          {...register("role", { required: "Função obrigatória" })}
        />
        {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Registro profissional</Label>
        <Input
          placeholder="Ex: CRP 06/12345"
          maxLength={20}
          {...register("professional_register")}
          onChange={(e) => {
            e.target.value = maskRegister(e.target.value);
            register("professional_register").onChange(e);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Especialidade</Label>
        <Input
          placeholder="Ex: Terapia Cognitivo-Comportamental"
          {...register("specialty")}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <select className={selectClass} {...register("status")}>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Licença">Licença</option>
        </select>
      </div>

      <SectionTitle>Contato</SectionTitle>

      <div className="space-y-1.5">
        <Label>E-mail</Label>
        <Input
          type="email"
          placeholder="profissional@email.com"
          {...register("email")}
        />
      </div>

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

      <SectionTitle>Acesso ao sistema</SectionTitle>

      <div className="sm:col-span-2 space-y-1.5">
        <Label>{isEdit ? "Nova senha de acesso" : "Senha de acesso"}</Label>
        <Input
          type="password"
          placeholder={isEdit ? "Deixe em branco para não alterar" : "Deixe em branco para não criar login"}
          {...register("password")}
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {isEdit
            ? "Somente preencha se quiser redefinir a senha deste funcionário."
            : "Se preenchida, um login será criado automaticamente com o e-mail informado."}
        </p>
      </div>

      <DialogFooter className="sm:col-span-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function FuncionariosPage() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProfessional, setEditProfessional] = useState(null);

  const createForm = useForm({
    defaultValues: {
      name: "", role: "", email: "", phone: "",
      professional_register: "", specialty: "", status: "Ativo", password: "",
    },
  });

  const editForm = useForm();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setHasLoadError(false);
      try {
        const response = await api.get("/api/professionals");
        setProfessionals(response.data);
      } catch {
        setHasLoadError(true);
        toast.error("Não foi possível carregar a lista de profissionais.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProfessionals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return professionals;
    return professionals.filter((p) =>
      [p.name, p.role, p.email, p.status]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(term)),
    );
  }, [professionals, search]);

  const activeCount = professionals.filter((p) => p.status?.toLowerCase() === "ativo").length;
  const totalCount = professionals.length;
  const inactiveCount = professionals.filter((p) => p.status?.toLowerCase() !== "ativo").length;

  function buildPayload(data) {
    return {
      name: data.name,
      role: data.role,
      email: data.email || null,
      phone: data.phone || null,
      professional_register: data.professional_register || null,
      specialty: data.specialty || null,
      status: data.status,
      password: data.password || null,
    };
  }

  const handleCreate = async (data) => {
    try {
      const response = await api.post("/api/professionals", buildPayload(data));
      setProfessionals((cur) => [...cur, response.data]);
      createForm.reset();
      setCreateOpen(false);
      toast.success("Funcionário cadastrado com sucesso!");
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already exists") || detail.includes("email")) {
        toast.error("Este e-mail já está cadastrado no sistema.");
      } else {
        toast.error(detail || "Não foi possível cadastrar o funcionário.");
      }
    }
  };

  const handleOpenEdit = (e, professional) => {
    e.stopPropagation();
    editForm.reset({
      name: professional.name || "",
      role: professional.role || "",
      email: professional.email || "",
      phone: professional.phone || "",
      professional_register: professional.professional_register || "",
      specialty: professional.specialty || "",
      status: professional.status || "Ativo",
      password: "",
    });
    setEditProfessional(professional);
  };

  const handleEdit = async (data) => {
    try {
      const response = await api.put(`/api/professionals/${editProfessional.id}`, buildPayload(data));
      setProfessionals((cur) =>
        cur.map((p) => (p.id === editProfessional.id ? response.data : p)),
      );
      setEditProfessional(null);
      toast.success("Funcionário atualizado com sucesso!");
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already exists") || detail.includes("email")) {
        toast.error("Este e-mail já está cadastrado por outro funcionário.");
      } else {
        toast.error(detail || "Não foi possível atualizar o funcionário.");
      }
    }
  };



  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
                Funcionários
              </p>
              <h2 className="mt-3 text-2xl font-bold">Gestão da equipe</h2>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 space-y-4 text-slate-700 dark:text-slate-300">
            <p>Acompanhe a equipe de profissionais, revise permissões e atualize dados de contato com facilidade.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Profissionais ativos", value: activeCount },
                { label: "Total", value: totalCount },
                { label: "Inativos / Licença", value: inactiveCount },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
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
              <h2 className="mt-3 text-2xl font-bold">Ferramentas</h2>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-700 p-3 text-slate-700 dark:text-slate-300">
              <Plus className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8">
            <Button
              onClick={() => setCreateOpen(true)}
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" /> Cadastrar novo funcionário
            </Button>
          </div>
        </Card>
      </div>

      {/* Dialog: Cadastrar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => { setCreateOpen(false); createForm.reset(); }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do profissional. Se informar e-mail e senha, ele poderá acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <ProfessionalForm
            form={createForm}
            onSubmit={handleCreate}
            submitLabel="Cadastrar funcionário"
            onCancel={() => { setCreateOpen(false); createForm.reset(); }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={!!editProfessional} onOpenChange={(v) => !v && setEditProfessional(null)}>
        {editProfessional && (
          <DialogContent onClose={() => setEditProfessional(null)} className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar funcionário</DialogTitle>
              <DialogDescription>Atualize os dados de {editProfessional.name}.</DialogDescription>
            </DialogHeader>
            <ProfessionalForm
              form={editForm}
              onSubmit={handleEdit}
              submitLabel="Salvar alterações"
              isEdit
              onCancel={() => setEditProfessional(null)}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Tabela */}
      <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
              Lista de funcionários
            </p>
            <h2 className="mt-3 text-2xl font-bold">Equipe atual</h2>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, função ou e-mail"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Carregando profissionais...</div>
          ) : hasLoadError ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">Erro ao carregar dados.</div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {["Nome", "Função", "Especialidade", "Registro", "E-mail", "Telefone", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProfessionals.length > 0 ? (
                  filteredProfessionals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.role}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{p.specialty ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.professional_register ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{p.email ?? "—"}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.phone ?? "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          p.status === "Ativo"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "Licença"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                          {p.status ?? "Ativo"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          className="h-9 px-3 text-slate-600 dark:text-slate-300"
                          onClick={(e) => handleOpenEdit(e, p)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Nenhum profissional encontrado.
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
