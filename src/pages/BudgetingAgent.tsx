import { useState } from 'react';
import PathSelection from '../components/budgeting-agent/PathSelection';
import FastPath from '../components/budgeting-agent/FastPath';
import FullPath from '../components/budgeting-agent/FullPath';
import type { BudgetingAgentProject } from '../types/budgeting-agent';
import '../components/budgeting-agent/budgeting-agent.css';

type PathType = 'fast' | 'full' | null;

export default function BudgetingAgent() {
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [project, setProject] = useState<BudgetingAgentProject>({
    id: crypto.randomUUID(),
    name: '',
    engagementLength: 0,
    pathType: null,
    createdAt: new Date().toISOString(),
  });

  const handlePathSelect = (path: PathType) => {
    setSelectedPath(path);
    setProject(prev => ({
      ...prev,
      pathType: path,
    }));
  };

  const handleBack = () => {
    setSelectedPath(null);
  };

  return (
    <div className="budgeting-agent-container">
      {!selectedPath && (
        <PathSelection onSelectPath={handlePathSelect} />
      )}
      
      {selectedPath === 'fast' && (
        <FastPath 
          project={project} 
          onUpdate={setProject}
          onBack={handleBack}
        />
      )}
      
      {selectedPath === 'full' && (
        <FullPath 
          project={project} 
          onUpdate={setProject}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
