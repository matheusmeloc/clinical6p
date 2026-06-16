import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Card } from "../components/ui/Card";
import { Button } from "../components/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { maskPhone } from "../lib/masks";
import { User, Lock, Shield, Save, Camera, Trash2, Moon, Sun, Send } from "lucide-react";
import { useTheme } from "../lib/useTheme";
import api from "../lib/api";

const getUserFromStorage = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};


export default function ConfiguracoesPage() {
  const user = getUserFromStorage();
  const isAdmin = user?.role === "admin";

  const { dark, toggle: toggleTheme } = useTheme();
  const [photoPreview, setPhotoPreview] = useState(user?.photo || null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const response = await api.get("/api/debug/test-email");
      if (response.data.success) {
        toast.success("SMTP conectado e autenticado com sucesso!");
      } else {
        toast.error(`Falha no SMTP: ${response.data.error || "Erro desconhecido"}`);
        console.error(response.data.traceback);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao tentar conectar com o servidor SMTP.");
    } finally {
      setTestingSmtp(false);
    }
  };
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Form: Perfil ──
  const profileForm = useForm({
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      role_title: user?.role_title || "",
      crp: user?.crp || "",
    },
  });

  // ── Form: Senha ──
  const passwordForm = useForm({
    defaultValues: { password: "", confirm_password: "" },
  });



  // Redimensiona e comprime a imagem antes de enviar
  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 256;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = url;
    });

  // ── Upload de foto ──
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 5 * 1024 * 1024) { toast.error("A foto deve ter no máximo 5 MB."); return; }
    setPhotoUploading(true);
    try {
      const base64 = await compressImage(file);
      setPhotoPreview(base64);
      await api.put(`/api/users/${user.id}`, { photo: base64 });
      const updated = { ...getUserFromStorage(), photo: base64 };
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Foto atualizada!");
    } catch {
      toast.error("Erro ao salvar a foto.");
      setPhotoPreview(user?.photo || null);
    } finally { setPhotoUploading(false); }
  };

  const handleRemovePhoto = async () => {
    setPhotoUploading(true);
    try {
      await api.put(`/api/users/${user.id}`, { photo: null });
      const updated = { ...getUserFromStorage(), photo: null };
      localStorage.setItem("user", JSON.stringify(updated));
      setPhotoPreview(null);
      toast.success("Foto removida.");
    } catch { toast.error("Erro ao remover a foto."); }
    finally { setPhotoUploading(false); }
  };

  // ── Salvar perfil ──
  const handleSaveProfile = async (data) => {
    try {
      const response = await api.put(`/api/users/${user.id}`, {
        full_name: data.full_name || null,
        phone: data.phone || null,
        role_title: data.role_title || null,
        crp: data.crp || null,
      });
      const updated = { ...user, full_name: response.data.full_name, phone: response.data.phone, role_title: response.data.role_title, crp: response.data.crp };
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) { toast.error(err.response?.data?.detail || "Erro ao atualizar perfil."); }
  };

  // ── Salvar senha ──
  const handleSavePassword = async (data) => {
    if (data.password !== data.confirm_password) { toast.error("As senhas não coincidem."); return; }
    if (data.password.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres."); return; }
    try {
      await api.put(`/api/users/${user.id}`, { password: data.password });
      passwordForm.reset();
      toast.success("Senha alterada com sucesso!");
    } catch (err) { toast.error(err.response?.data?.detail || "Erro ao alterar senha."); }
  };



  return (
    <div className="space-y-6">

        {/* ── Perfil ── */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 p-3 text-emerald-700 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Dados do perfil</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Atualize suas informações pessoais e profissionais.</p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div className="relative shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto de perfil" className="h-16 w-16 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-600 text-white text-xl font-bold shadow-sm">
                  {(user?.full_name || "?").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase()}
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                title="Trocar foto">
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.full_name || "Usuário"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <span className="inline-flex items-center mt-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {user?.role === "admin" ? "Administrador" : "Profissional"}
              </span>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                {photoUploading ? "Salvando..." : "Trocar foto"}
              </Button>
              {photoPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} disabled={photoUploading}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remover
                </Button>
              )}
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input placeholder="Seu nome" {...profileForm.register("full_name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input placeholder="(11) 99999-0000" maxLength={16}
                  {...profileForm.register("phone")}
                  onChange={(e) => {
                    e.target.value = maskPhone(e.target.value);
                    profileForm.register("phone").onChange(e);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo / Título</Label>
                <Input placeholder="Ex: Psicóloga Clínica" {...profileForm.register("role_title")} />
              </div>
              <div className="space-y-1.5">
                <Label>Registro profissional (CRP/CRM)</Label>
                <Input placeholder="Ex: CRP 06/12345" {...profileForm.register("crp")} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileForm.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar perfil"}
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Senha ── */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-700 p-3 text-slate-700 dark:text-slate-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Alterar senha</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Defina uma nova senha de acesso ao sistema.</p>
            </div>
          </div>
          <form onSubmit={passwordForm.handleSubmit(handleSavePassword)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres"
                  {...passwordForm.register("password", { required: "Obrigatório" })} />
                {passwordForm.formState.errors.password && (
                  <p className="text-xs text-red-500 dark:text-red-400">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar nova senha</Label>
                <Input type="password" placeholder="Repita a senha"
                  {...passwordForm.register("confirm_password", { required: "Obrigatório" })} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={passwordForm.formState.isSubmitting} variant="dark">
                <Lock className="w-4 h-4 mr-2" />
                {passwordForm.formState.isSubmitting ? "Alterando..." : "Alterar senha"}
              </Button>
            </div>
          </form>
        </Card>



        {/* ── Tema ── */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 dark:bg-slate-700 p-3 text-slate-700 dark:text-slate-300">
                {dark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Aparência</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tema atual: <span className="font-medium">{dark ? "Escuro" : "Claro"}</span>
                </p>
              </div>
            </div>
            <button onClick={toggleTheme}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${dark ? "bg-emerald-600" : "bg-slate-200"}`}
              role="switch" aria-checked={dark}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${dark ? "translate-x-8" : "translate-x-1"}`} />
            </button>
          </div>
        </Card>

        {/* ── Diagnóstico SMTP (só admin) ── */}
        {isAdmin && (
          <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-3 text-blue-700 dark:text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Diagnóstico de E-mail (SMTP)</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Verifique se as credenciais SMTP salvas no backend estão funcionando corretamente.</p>
              </div>
            </div>
            <div className="flex justify-start">
              <Button 
                type="button" 
                onClick={handleTestSmtp} 
                disabled={testingSmtp} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {testingSmtp ? "Testando conexão..." : "Testar Conexão SMTP"}
              </Button>
            </div>
          </Card>
        )}

        {/* ── Info do sistema ── */}
        <Card className="bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-slate-100 dark:bg-slate-700 p-3 text-slate-700 dark:text-slate-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Informações do sistema</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3">
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide">Usuário logado</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{user?.full_name || "—"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3">
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide">E-mail</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{user?.email || "—"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3">
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide">Perfil de acesso</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                {user?.role === "admin" ? "Administrador" : "Profissional"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3">
              <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide">Versão</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">Instituto de Psicologia v1.0</p>
            </div>
          </div>
        </Card>

    </div>
  );
}
