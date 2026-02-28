import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Diagnostic logs to detect full page reloads vs SPA remounts
try {
	const nav = (window.performance && (window.performance.getEntriesByType as any) && window.performance.getEntriesByType('navigation')) || [];
	const navType = nav[0]?.type || (performance && (performance as any).navigation ? ((performance as any).navigation.type === 1 ? 'reload' : 'navigate') : 'unknown');
	console.log('[App] main.tsx mount - navigation type:', navType);
} catch (e) {
	console.log('[App] main.tsx mount - navigation type: unknown');
}

window.addEventListener('beforeunload', () => {
	console.log('[App] beforeunload event fired');
});

function showFatalErrorOverlay(title: string, details?: string) {
	try {
		const root = document.getElementById('root');
		if (!root) return;
		const html = `
			<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:24px; color:#111; background:#fff; height:100vh; box-sizing:border-box;">
				<h1 style="margin:0 0 8px 0; font-size:20px;">${title}</h1>
				<pre style="white-space:pre-wrap; color:#c00; background:#f9f2f4; padding:12px; border-radius:6px; overflow:auto; max-height:60vh;">${details || ''}</pre>
				<p style="margin-top:12px;">Ouvrez la console pour plus d'informations.</p>
			</div>
		`;
		root.innerHTML = html;
	} catch (e) {
		console.error('Failed to render fatal overlay', e);
	}
}

// Global error handlers to avoid silent page-white
window.addEventListener('error', (ev) => {
	console.error('[Global] error', ev.error || ev.message, ev.error || ev);
	showFatalErrorOverlay('Erreur critique de l\'application', String(ev.error || ev.message || ev));
});

window.addEventListener('unhandledrejection', (ev) => {
	console.error('[Global] unhandledrejection', ev.reason);
	showFatalErrorOverlay('Erreur critique (Promise non gérée)', String(ev.reason));
});

try {
	const rootEl = document.getElementById('root');
	if (!rootEl) throw new Error('Element #root introuvable');
	createRoot(rootEl).render(<App />);
} catch (e) {
	console.error('[App] mount failed', e);
	showFatalErrorOverlay('Échec du montage de l\'application', String(e));
}
