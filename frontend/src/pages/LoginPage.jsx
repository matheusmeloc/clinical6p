import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import api from "../lib/api";
import { Leaf, LogIn, User, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("pro");
  const [proFormData, setProFormData] = useState({ email: "", password: "" });
  const [patientFormData, setPatientFormData] = useState({
    cpf: "",
    password: "",
    message: "",
  });
  const [proError, setProError] = useState("");
  const [patientError, setPatientError] = useState("");
  const [patientSuccess, setPatientSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "IP | Login";
  }, []);

  const handleProChange = (e) => {
    const { name, value } = e.target;
    setProFormData((prev) => ({ ...prev, [name]: value }));
    setProError("");
  };

  const handlePatientChange = (e) => {
    const { name, value } = e.target;
    setPatientFormData((prev) => ({ ...prev, [name]: value }));
    setPatientError("");
  };

  const handleProLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProError("");
    try {
      const response = await api.post("/api/login", {
        email: proFormData.email,
        password: proFormData.password,
      });
      const { access_token, token_type, ...userData } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setProError(error.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientContact = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPatientError("");
    setPatientSuccess("");
    try {
      await api.post("/api/patient-contact", {
        cpf: patientFormData.cpf.replace(/\D/g, ""),
        password: patientFormData.password,
        message: patientFormData.message,
      });
      setPatientSuccess(
        "Mensagem enviada com sucesso! Seu psicólogo receberá em breve.",
      );
      setPatientFormData({ cpf: "", password: "", message: "" });
    } catch (error) {
      setPatientError(
        error.response?.data?.detail || "Erro ao enviar mensagem",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/api/forgot-password", { email: forgotEmail });
      alert("Email de recuperação enviado com sucesso!");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error) {
      alert(
        error.response?.data?.detail || "Erro ao enviar email de recuperação",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #d1fae5 0%, #f0fdf4 30%, #f8fafc 60%, #e0f2fe 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo acima do card */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Instituto de Psicologia</h1>
          <p className="text-gray-500 text-sm mt-1">Bem-vindo de volta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("pro")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === "pro"
                  ? "bg-white shadow text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Profissional
            </button>
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === "patient"
                  ? "bg-white shadow text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4" />
              Paciente
            </button>
          </div>

          {/* Formulário - Profissional */}
          {activeTab === "pro" && (
            <form onSubmit={handleProLogin} className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  name="email"
                  value={proFormData.email}
                  onChange={handleProChange}
                  placeholder="seu@email.com"
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Lock className="w-4 h-4 text-green-600" />
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  value={proFormData.password}
                  onChange={handleProChange}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl text-base">
                {isLoading ? "Entrando..." : "Entrar no Painel"}
              </Button>

              {proError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {proError}
                </div>
              )}
            </form>
          )}

          {/* Formulário - Paciente */}
          {activeTab === "patient" && (
            <form onSubmit={handlePatientContact} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF (Apenas números ou formatado)
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={patientFormData.cpf}
                  onChange={handlePatientChange}
                  placeholder="000.000.000-00"
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Lock className="w-4 h-4 text-green-600" />
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  value={patientFormData.password}
                  onChange={handlePatientChange}
                  placeholder="••••••••"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Como foi seu dia? O que aconteceu de importante?
                </label>
                <textarea
                  name="message"
                  value={patientFormData.message}
                  onChange={handlePatientChange}
                  placeholder="Escreva aqui anotações importantes para conversar com seu psicólogo..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl text-base">
                {isLoading ? "Enviando..." : "Enviar"}
              </Button>

              {patientError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {patientError}
                </div>
              )}
              {patientSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                  {patientSuccess}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Modal - Recuperação de Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Recuperar Senha</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Digite seu e-mail de cadastro. Se encontrarmos sua conta, enviaremos um
              link de redefinição de senha válido por 1 hora.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
