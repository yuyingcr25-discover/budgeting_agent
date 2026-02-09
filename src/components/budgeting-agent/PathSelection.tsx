import { Clock, Zap } from 'lucide-react';

interface PathSelectionProps {
  onSelectPath: (path: 'fast' | 'full') => void;
}

export default function PathSelection({ onSelectPath }: PathSelectionProps) {
  return (
    <div className="path-selection">
      <div className="path-selection-header">
        <h1>Budgeting Agent</h1>
        <p>Choose your project path to get started</p>
      </div>

      <div className="path-cards">
        <div 
          className="path-card fast-path"
          onClick={() => onSelectPath('fast')}
        >
          <div className="path-icon">
            <Zap size={48} />
          </div>
          <h2>Fast Path</h2>
          <p className="path-description">
            For quick projects under 1 month
          </p>
          <ul className="path-features">
            <li>Streamlined process</li>
            <li>Optional resource assignment</li>
            <li>Even hour distribution</li>
            <li>Quick output generation</li>
          </ul>
          <button className="path-button">
            Select Fast Path
          </button>
        </div>

        <div 
          className="path-card full-path"
          onClick={() => onSelectPath('full')}
        >
          <div className="path-icon">
            <Clock size={48} />
          </div>
          <h2>Full Path</h2>
          <p className="path-description">
            For engagements longer than 1 month
          </p>
          <ul className="path-features">
            <li>AI-powered assistance</li>
            <li>Resource planning by level</li>
            <li>Weekly allocation management</li>
            <li>Conversational budget building</li>
          </ul>
          <button className="path-button">
            Select Full Path
          </button>
        </div>
      </div>
    </div>
  );
}
