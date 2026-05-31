import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Users, Plus, Search, Heart, Edit3 } from "lucide-react";
import api from "../lib/api";

export default function PacientesPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/api/patients");
        setPatients(response.data);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar a lista de pacientes.");
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      return [
        patient.name,
        patient.cpf,
        patient.status,
        patient.email,
        patient.phone,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [patients, search]);

  const activeCount = patients.filter(
    (patient) => patient.status?.toLowerCase() === "ativo",
  ).length;
  const totalCount = patients.length;
  const waitingCount = patients.filter(
    (patient) => patient.status?.toLowerCase() === "aguardando",
  ).length;

  const latestRegistration = patients
    .map((patient) => patient.created_at && new Date(patient.created_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("pt-BR") : "—";

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
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Cadastrar novo paciente</span>
              </div>
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Buscar paciente</span>
              </div>
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-white/90 border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
              Lista de pacientes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Registros recentes</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, CPF ou status"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <Button variant="secondary" className="h-11 px-4">
              <Heart className="w-4 h-4 mr-2" /> Ver histórico
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Carregando pacientes...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Cadastro
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {patient.name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {patient.cpf ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {patient.status ?? "Ativo"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" className="h-9 px-3">
                          <Edit3 className="w-4 h-4 mr-2" /> Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-500"
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
