import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Search, Mail, CheckCircle, MessageSquare, Bookmark, BookmarkCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import api from "../lib/api";

export default function MensagensPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const formatDate = (value) => {
    if (!value) return "—";
    // Garante que o backend UTC seja interpretado corretamente (adiciona Z se ausente)
    const iso = value.endsWith("Z") || value.includes("+") ? value : value + "Z";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((m) => ({ ...m, is_read: true }));
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível marcar a mensagem como lida. Tente novamente.");
    }
  };

  const handleSaveToPatient = async (messageId) => {
    try {
      await api.put(`/api/patient-messages/${messageId}/save`);
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, saved: true } : message,
        ),
      );
      if (selectedMessage?.id === messageId) {
        setSelectedMessage((m) => ({ ...m, saved: true }));
      }
      toast.success("Mensagem salva no card do paciente.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível salvar a mensagem.");
    }
  };

  const totalCount = messages.length;
  const unreadCount = messages.filter((item) => !item.is_read).length;
  const latestMessage = messages
    .filter((item) => item.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at;

  return (
    <div className="space-y-6">
      {/* ── Dialog: Detalhe da mensagem ── */}
      <Dialog open={!!selectedMessage} onOpenChange={(v) => !v && setSelectedMessage(null)}>
        {selectedMessage && (
          <DialogContent onClose={() => setSelectedMessage(null)} className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Mensagem de {selectedMessage.patient_name || "Paciente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{formatDate(selectedMessage.created_at)}</span>
                {selectedMessage.professional_name && (
                  <span>· Para: <span className="font-medium">{selectedMessage.professional_name}</span></span>
                )}
                <span>·</span>
                {selectedMessage.is_read ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Lida
                  </span>
                ) : (
                  <span className="text-amber-500 font-medium">Não lida</span>
                )}
                {selectedMessage.saved && (
                  <span className="text-blue-600 font-medium flex items-center gap-1">
                    <BookmarkCheck className="w-3 h-3" /> Salva no paciente
                  </span>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-4">
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
            <DialogFooter>
              {!selectedMessage.is_read && (
                <Button variant="secondary" onClick={() => handleMarkAsRead(selectedMessage.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Marcar como lida
                </Button>
              )}
              {!selectedMessage.saved && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleSaveToPatient(selectedMessage.id)}
                >
                  <Bookmark className="w-4 h-4 mr-2" /> Salvar no paciente
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Total de mensagens</p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{totalCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Mensagens recebidas.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Não lidas</p>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-slate-100">{unreadCount}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Aguardando leitura.</p>
        </Card>
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">Última mensagem</p>
          <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatDate(latestMessage)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Data do último contato.</p>
        </Card>
      </div>

      <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold">
              Mensagens recentes
            </p>
            <h2 className="mt-3 text-2xl font-bold">Caixa de entrada</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por paciente, profissional ou conteúdo"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-3 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <Button variant="secondary" onClick={loadMessages} className="shrink-0">
              Atualizar
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Carregando mensagens...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : (
            <table className="min-w-[640px] w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Paciente
                  </th>
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Mensagem
                  </th>
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Data
                  </th>
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMessage(item)}
                    >
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {item.patient_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                        {item.professional_name || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 max-w-[360px] truncate">
                        {item.message}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
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
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {!item.is_read && (
                            <Button
                              variant="secondary"
                              className="h-9 px-3"
                              onClick={() => handleMarkAsRead(item.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Marcar lida
                            </Button>
                          )}
                          {item.saved && (
                            <span title="Salva no paciente">
                              <BookmarkCheck className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
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


