import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Search, Mail, CheckCircle, MessageSquare } from "lucide-react";
import api from "../lib/api";

export default function MensagensPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const filteredMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;

    return messages.filter((item) => {
      return [
        item.patient_name,
        item.professional_name,
        item.message,
        item.is_read ? "lida" : "não lida",
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [messages, search]);

  const loadMessages = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/patient-messages");
      setMessages(response.data);
    } catch (err) {
      console.error(err);
      setError(
        "Não foi possível carregar as mensagens. Faça login e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleMarkAsRead = async (messageId) => {
    try {
      await api.put(`/api/patient-messages/${messageId}/read`);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, is_read: true } : message,
        ),
      );
    } catch (err) {
      console.error(err);
      setError(
        "Não foi possível marcar a mensagem como lida. Tente novamente.",
      );
    }
  };

  const totalCount = messages.length;
  const unreadCount = messages.filter((item) => !item.is_read).length;
  const latestMessage = messages
    .map((item) => item.created_at && new Date(item.created_at))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="bg-white/90 border border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
                Mensagens
              </p>
              <h2 className="mt-3 text-2xl font-bold">
                Central de comunicação
              </h2>
            </div>
            <div className="rounded-3xl bg-emerald-100 p-3 text-emerald-700">
              <Mail className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4 text-slate-700">
            <p>
              Aqui você visualiza todas as mensagens enviadas pelos pacientes e
              acompanha os atendimentos que ainda precisam de resposta.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Total de mensagens</p>
                <p className="mt-3 text-3xl font-semibold">{totalCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Não lidas</p>
                <p className="mt-3 text-3xl font-semibold">{unreadCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Última mensagem</p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatDate(latestMessage)}
                </p>
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
              <h2 className="mt-3 text-2xl font-bold">
                Organize seu atendimento
              </h2>
            </div>
            <div className="rounded-3xl bg-slate-100 p-3 text-slate-700">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Button
              variant="ghost"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-slate-100 h-auto justify-between"
              onClick={loadMessages}
            >
              <span>Atualizar mensagens</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-slate-100 h-auto justify-between"
            >
              <span>Responder no sistema do paciente</span>
            </Button>
          </div>
        </Card>
      </div>

      <Card className="bg-white/90 border border-slate-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">
              Mensagens recentes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Caixa de entrada</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente, profissional ou conteúdo"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Carregando mensagens...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Mensagem
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Data
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-slate-500 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((item) => (
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
                      <td className="px-4 py-4 text-slate-600 max-w-[360px] truncate">
                        {item.message}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.is_read ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                            Lida
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                            Não lida
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {!item.is_read && (
                          <Button
                            variant="secondary"
                            className="h-9 px-3"
                            onClick={() => handleMarkAsRead(item.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Marcar lida
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Nenhuma mensagem encontrada.
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

