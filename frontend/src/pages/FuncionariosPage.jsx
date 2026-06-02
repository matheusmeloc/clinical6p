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

export default function FuncionariosPage() {
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
      role: "",
      email: "",
      phone: "",
      professional_register: "",
      specialty: "",
      status: "Ativo",
      password: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setHasLoadError(false);
      try {
        const response = await api.get("/api/professionals");
        setProfessionals(response.data);
      } catch (err) {
        console.error(err);
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

  const handleCreate = async (data) => {
    try {
      const payload = {
        name: data.name,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        professional_register: data.professional_register || null,
        specialty: data.specialty || null,
        status: data.status,
        password: data.password || null,
      };
      const response = await api.post("/api/professionals", payload);
      setProfessionals((current) => [...current, response.data]);
      reset();
      setDialogOpen(false);
      toast.success("Funcionário cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already exists") || detail.includes("email")) {
        toast.error("Este e-mail já está cadastrado no sistema.");
      } else {
        toast.error(detail || "Não foi possível cadastrar o funcionário. Verifique os dados.");
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
            <p>
              Acompanhe a equipe de profissionais, revise permissões e atualize
              dados de contato com facilidade.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Profissionais ativos</p>
                <p className="mt-3 text-3xl font-semibold">{activeCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
                <p className="mt-3 text-3xl font-semibold">{totalCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Inativos / Licença</p>
                <p className="mt-3 text-3xl font-semibold">{inactiveCount}</p>
              </div>
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

          <div className="mt-8 space-y-4">
            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Cadastrar novo funcionário
            </Button>
          </div>
        </Card>
      </div>

      {/* Dialog de cadastro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={handleClose} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do profissional. Se informar e-mail e senha, ele
              poderá acessar o sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreate)} className="grid gap-4 sm:grid-cols-2">
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

            <div className="space-y-1.5">
              <Label>Senha de acesso</Label>
              <Input
                type="password"
                placeholder="Deixe em branco para não criar login"
                {...register("password")}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Se preenchida, um login será criado automaticamente.
              </p>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Salvando..." : "Cadastrar funcionário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}>
                          {p.status ?? "Ativo"}
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


