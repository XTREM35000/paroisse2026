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

createRoot(document.getElementById("root")!).render(<App />);
