import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Search, Plus, FileCheck, Clipboard, Trash } from "lucide-react";
import api from "../lib/api";

export default function AtestadosPage() {
  const [certificates, setCertificates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patient_id: "",
      professional_id: "",
      type: "Médico",
      duration_days: "",
      date: "",
      description: "",
    },
  });

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "—";

  const filteredCertificates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return certificates;

    return certificates.filter((item) => {
      return [
        item.patient_name,
        item.professional_name,
        item.type,
        item.description,
        item.duration_days?.toString(),
        item.date,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [certificates, search]);

  const loadData = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [certRes, patientsRes, prosRes] = await Promise.all([
        api.get("/api/certificates"),
        api.get("/api/patients"),
        api.get("/api/professionals"),
      ]);

      setCertificates(certRes.data);
      setPatients(patientsRes.data);
      setProfessionals(prosRes.data);
    } catch (err) {
      console.error(err);
      setLoadError(
        "Não foi possível carregar os atestados. Faça login e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCertificate = async (data) => {
    setFormError("");
    setFormSuccess("");
    try {
      const payload = {
        patient_id: Number(data.patient_id),
        professional_id: Number(data.professional_id),
        type: data.type,
        duration_days: data.duration_days ? Number(data.duration_days) : null,
        description: data.description || null,
        date: data.date || null,
      };

      const response = await api.post("/api/certificates", payload);
      setCertificates((current) => [response.data, ...current]);
      reset();
      setDialogOpen(false);
      setFormSuccess("Atestado criado com sucesso!");
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.detail || "Não foi possível criar o atestado. Verifique os dados e tente novamente.",
      );
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    try {
      await api.delete(`/api/certificates/${certificateId}`);
      setCertificates((current) =>
        current.filter((certificate) => certificate.id !== certificateId),
      );
    } catch (err) {
      console.error(err);
      setFormError("Não foi possível excluir o atestado. Tente novamente.");
    }
  };

  const totalCount = certificates.length;
  const lastIssued = certificates
    .map((item) => item.date && new Date(item.date))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];
  const medicalCount = certificates.filter(
    (item) => item.type === "Médico",
  ).length;
  const attendanceCount = certificates.filter(
    (item) => item.type === "Comparecimento",
  ).length;

  return (
    <div className="space-y-6">
      {formSuccess && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {formSuccess}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="bg-white/90 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                Atestados
              </p>
              <h2 className="mt-3 text-2xl font-bold">Gestão de atestados</h2>
            </div>
            <div className="rounded-3xl bg-emerald-100 p-3 text-emerald-700">
              <FileCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4 text-slate-700">
            <p>
              Consulte os atestados emitidos, registre novos documentos e
              mantenha o histórico de ausências ordenado.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Total de atestados</p>
                <p className="mt-3 text-3xl font-semibold">{totalCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Médico</p>
                <p className="mt-3 text-3xl font-semibold">{medicalCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Comparecimento</p>
                <p className="mt-3 text-3xl font-semibold">{attendanceCount}</p>
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
              <h2 className="mt-3 text-2xl font-bold">Registrar atestado</h2>
            </div>
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-700">
              <Clipboard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => setDialogOpen(true)}
              className="w-full justify-between bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo atestado
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => { setDialogOpen(false); setFormError(""); reset(); }} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo atestado</DialogTitle>
            <DialogDescription>Preencha os dados para emitir um novo atestado.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateCertificate)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                {...register("patient_id", { required: "Obrigatório" })}>
                <option value="">Selecione um paciente</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.patient_id && <p className="text-xs text-red-600">{errors.patient_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                {...register("professional_id", { required: "Obrigatório" })}>
                <option value="">Selecione um profissional</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.professional_id && <p className="text-xs text-red-600">{errors.professional_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de atestado</Label>
              <select className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                {...register("type", { required: "Obrigatório" })}>
                <option value="Médico">Médico</option>
                <option value="Comparecimento">Comparecimento</option>
              </select>
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Duração (dias)</Label>
              <Input type="number" min="0" placeholder="Ex: 3" {...register("duration_days")} />
            </div>

            <div className="space-y-1.5">
              <Label>Data de emissão</Label>
              <Input type="date" min={new Date().toISOString().split("T")[0]} {...register("date")} />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Descrição</Label>
              <Textarea placeholder="Explique o motivo do atestado ou instruções adicionais" {...register("description")} rows={3} />
            </div>

            {formError && (
              <div className="sm:col-span-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => { setDialogOpen(false); setFormError(""); reset(); }}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Salvar atestado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/90 border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
              Atestados recentes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Histórico de atestados</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente, profissional ou tipo"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Carregando atestados...
            </div>
          ) : loadError ? (
            <div className="p-8 text-center text-red-600">{loadError}</div>
          ) : (
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Duração
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Data
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCertificates.length > 0 ? (
                  filteredCertificates.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.patient_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.professional_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.type || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.duration_days ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-4 text-slate-600 max-w-[320px] truncate">
                        {item.description || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          className="h-9 px-3"
                          onClick={() => handleDeleteCertificate(item.id)}
                        >
                          <Trash className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Nenhum atestado encontrado.
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
