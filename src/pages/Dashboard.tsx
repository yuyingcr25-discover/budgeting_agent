import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';

export function Dashboard() {
  const { savedProjects, resetProject } = useProjectStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <Clock size={16} className="status-icon draft" />;
      case 'Submitted':
        return <AlertCircle size={16} className="status-icon submitted" />;
      case 'Approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage your project setup workbooks</p>
        </div>
        <Link to="/project/new" className="btn btn-primary" onClick={() => resetProject()}>
          <Plus size={18} />
          New Project
        </Link>
      </div>

      {savedProjects.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h2>No projects yet</h2>
          <p>Create your first project setup workbook to get started</p>
          <Link to="/project/new" className="btn btn-primary" onClick={() => resetProject()}>
            <Plus size={18} />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="projects-grid">
          {savedProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="project-card"
            >
              <div className="project-card-header">
                <div className="project-status">
                  {getStatusIcon(project.status)}
                  <span>{project.status}</span>
                </div>
                <span className="project-date">{formatDate(project.updatedAt)}</span>
              </div>

              <h3 className="project-name">
                {project.clientName || 'Untitled Project'}
              </h3>

              <div className="project-meta">
                <div className="meta-item">
                  <span className="label">Project #</span>
                  <span className="value">{project.sapProjectId || '—'}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Year End</span>
                  <span className="value">{project.yearEnd || '—'}</span>
                </div>
              </div>

              <div className="project-stats">
                <div className="stat">
                  <span className="value">
                    {project.budgetLines.reduce((sum, l) => sum + l.hours, 0)}
                  </span>
                  <span className="label">Hours</span>
                </div>
                <div className="stat">
                  <span className="value">{project.resourceDemands.length}</span>
                  <span className="label">Resources</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{savedProjects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {savedProjects.filter((p) => p.status === 'Draft').length}
          </div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {savedProjects.filter((p) => p.status === 'Submitted').length}
          </div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {savedProjects.filter((p) => p.status === 'Approved').length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
      </div>
    </div>
  );
}
