import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'react-hot-toast';

registerSW({
  onNeedRefresh() {
    toast(
      (t) => (
        <span className="flex items-center gap-3 text-xs font-semibold">
          App update available.
          <button
            onClick={() => { window.location.reload(); toast.dismiss(t.id); }}
            className="px-2 py-1 rounded bg-indigo-600 text-white font-bold"
          >
            Refresh
          </button>
        </span>
      ),
      { duration: Infinity, id: 'sw-update' }
    );
  },
  onOfflineReady() {
    toast.success('App ready for offline use.', { duration: 3000 });
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
