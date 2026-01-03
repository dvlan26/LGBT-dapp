import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Global error handlers to avoid blank white screen in production and show visible errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error || event.message);
  const root = document.getElementById('root');
  if (root) root.innerHTML = `<div style="padding:20px;font-family:system-ui, Arial"><h3>应用运行时错误</h3><pre>${String(event.error || event.message)}</pre></div>`;
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled promise rejection:', ev.reason);
  const root = document.getElementById('root');
  if (root) root.innerHTML = `<div style="padding:20px;font-family:system-ui, Arial"><h3>未处理的 Promise 异常</h3><pre>${String(ev.reason)}</pre></div>`;
});

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  // Ensure any synchronous errors are visible in production builds
  console.error('Render failed:', err);
  const root = document.getElementById('root');
  if (root) root.innerHTML = '<div style="padding:40px; font-family: sans-serif;">应用加载失败，请查看控制台日志。</div>';
}
