import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;          // Text for confirm button, default: "Confirm"
  danger?: boolean;              // Red styling for destructive actions
  requireTyping?: string;        // If set, user must type this string to enable confirm
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, onConfirm, onCancel,
  confirmText = 'Confirm', danger = false, requireTyping
}) => {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!isOpen) setTyped('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !requireTyping || typed === requireTyping;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#12121a] border border-brand-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}>
              <AlertTriangle className={`w-5 h-5 ${danger ? 'text-rose-400' : 'text-amber-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-200 mb-1">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
              {requireTyping && (
                <div className="mt-4">
                  <p className="text-[11px] text-slate-400 mb-2">
                    Type <span className="font-black text-rose-400 font-mono">{requireTyping}</span> to confirm:
                  </p>
                  <input
                    autoFocus
                    value={typed}
                    onChange={e => setTyped(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-brand-border/80 text-sm font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                    placeholder={requireTyping}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              danger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
