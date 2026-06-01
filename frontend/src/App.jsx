import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardHomePage from "./pages/DashboardHomePage";
import PacientesPage from "./pages/PacientesPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import AgendamentosPage from "./pages/AgendamentosPage";
import ReceitasPage from "./pages/ReceitasPage";
import AtestadosPage from "./pages/AtestadosPage";
import MensagensPage from "./pages/MensagensPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardPage />}>
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/funcionarios" element={<FuncionariosPage />} />
            <Route path="/agendamentos" element={<AgendamentosPage />} />
            <Route path="/receitas" element={<ReceitasPage />} />
            <Route path="/atestados" element={<AtestadosPage />} />
            <Route path="/mensagens" element={<MensagensPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
