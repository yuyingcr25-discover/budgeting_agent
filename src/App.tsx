import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { ProjectWizard } from './pages/ProjectWizard';
import PrototypeWorkflow from './pages/PrototypeWorkflow';
import BudgetingAgent from './pages/BudgetingAgent';
import BudgetingAgentChat from './pages/BudgetingAgentChat';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/new" element={<ProjectWizard />} />
            <Route path="/project/:projectId" element={<ProjectWizard />} />
            <Route path="/prototype" element={<PrototypeWorkflow />} />
            <Route path="/budgeting-agent" element={<BudgetingAgent />} />
            <Route path="/budgeting-agent-chat" element={<BudgetingAgentChat />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
