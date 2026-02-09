import { useEffect, useState } from 'react';
import { loadCRMRecord, parseBudgetExcel, generateSAPPayload, generateProfindaPayload } from '../../lib/ocrParser';
import { mockHR } from '../../data/mockPrototypeData';
import AdvancedBudgetEditor from './AdvancedBudgetEditor';

export default function PrototypeSimulator() {
	const [view, setView] = useState<'crm' | 'budget' | 'sync'>('crm');
	const [crm, setCrm] = useState<any | null>(null);
	const [budget, setBudget] = useState<any | null>(null);
	// appliedHistorical is now handled inside the advanced editor

	const [sapProgress, setSapProgress] = useState(0);
	const [profProgress, setProfProgress] = useState(0);
	const [sapStatus, setSapStatus] = useState<'idle' | 'running' | 'completed'>('idle');
	const [profStatus, setProfStatus] = useState<'idle' | 'running' | 'completed'>('idle');

	useEffect(() => {
		(async () => setCrm(await loadCRMRecord()))();
	}, []);

	async function openBudgetEditor() {
		const data = await parseBudgetExcel();
		setBudget(data);
		setView('budget');
	}

	// detailed budget editing (per-role, per-week) is handled by AdvancedBudgetEditor

	function startSync() {
		if (!crm || !budget) return;
		setView('sync');
		setSapStatus('running');
		setProfStatus('running');

		const sapPayload = generateSAPPayload(crm, budget, mockHR);
		const profPayload = generateProfindaPayload(crm, mockHR);
		(window as any).__mockSapPayload = sapPayload;
		(window as any).__mockProfPayload = profPayload;

		setSapProgress(0);
		const sapInterval = setInterval(() => {
			setSapProgress((p) => {
				const np = Math.min(100, p + Math.floor(Math.random() * 20) + 10);
				if (np === 100) {
					clearInterval(sapInterval);
					setSapStatus('completed');
				}
				return np;
			});
		}, 300);

		setProfProgress(0);
		const profInterval = setInterval(() => {
			setProfProgress((p) => {
				const np = Math.min(100, p + Math.floor(Math.random() * 15) + 5);
				if (np === 100) {
					clearInterval(profInterval);
					setProfStatus('completed');
				}
				return np;
			});
		}, 350);
	}

	function downloadPayload(which: 'sap' | 'profinda') {
		const obj = which === 'sap' ? (window as any).__mockSapPayload : (window as any).__mockProfPayload;
		if (!obj) return;
		const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${which}-${which === 'sap' ? obj.sapImportId : obj.profindaId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div style={{ padding: 20 }}>
			<h2>Prototype: CRM → Budget Editor → Sync to SAP & Profinda</h2>

			{view === 'crm' && (
				<div>
					<h3>CRM: Project view (mock)</h3>
					<div style={{ display: 'flex', gap: 20 }}>
						<div style={{ flex: 1 }}>
							<img
								src="/Sample files/Input/CRM_1.PNG"
								alt="CRM screenshot"
								style={{ width: '100%', maxWidth: 600, border: '1px solid #ddd' }}
								onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
							/>
							{!crm && <div>Loading CRM sample...</div>}
							{crm && (
								<div style={{ marginTop: 12 }}>
									<div><strong>Project:</strong> {crm.name}</div>
									<div><strong>Account:</strong> {crm.account}</div>
									<div><strong>Owner:</strong> {crm.owner}</div>
								</div>
							)}
						</div>
						<div style={{ width: 220 }}>
							<h4>Actions</h4>
							<button onClick={openBudgetEditor} style={{ display: 'block', marginBottom: 8 }}>
								Project Setup
							</button>
						</div>
					</div>
				</div>
			)}

			{view === 'budget' && budget && (
				<div>
					{/* render the advanced editor (original wizard-style budget UI) */}
					<AdvancedBudgetEditor budget={budget} setBudget={setBudget} onBack={() => setView('crm')} onDone={startSync} />
				</div>
			)}

			{view === 'sync' && (
				<div>
					<h3>Sync in progress</h3>
					<div style={{ marginBottom: 12 }}>
						<div><strong>SAP Sync</strong> — {sapStatus}</div>
						<div style={{ background: '#eee', height: 18, width: '100%', borderRadius: 4 }}>
							<div style={{ width: `${sapProgress}%`, background: '#0b74de', height: '100%', borderRadius: 4 }} />
						</div>
						<div style={{ marginTop: 8 }}>
							{sapStatus === 'completed' && <button onClick={() => downloadPayload('sap')}>Download SAP payload</button>}
						</div>
					</div>

					<div style={{ marginBottom: 12 }}>
						<div><strong>Resource Management Sync</strong> — {profStatus}</div>
						<div style={{ background: '#eee', height: 18, width: '100%', borderRadius: 4 }}>
							<div style={{ width: `${profProgress}%`, background: '#16a34a', height: '100%', borderRadius: 4 }} />
						</div>
						<div style={{ marginTop: 8 }}>
							{profStatus === 'completed' && <button onClick={() => downloadPayload('profinda')}>Download Profinda payload</button>}
						</div>
					</div>

					{(sapStatus === 'completed' && profStatus === 'completed') && (
						<div style={{ marginTop: 16 }}>
							<strong>All done.</strong>
							<div style={{ marginTop: 8 }}>
								<button onClick={() => { setView('crm'); setSapProgress(0); setProfProgress(0); setSapStatus('idle'); setProfStatus('idle'); }}>
									Back to CRM
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
