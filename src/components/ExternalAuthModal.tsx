import React, { useState } from 'react';
import { KeyRound, Lock, Globe, ShieldCheck, X, Check, Eye, EyeOff } from 'lucide-react';

interface ExternalAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCredentials: (credentials: {
    serviceName: string;
    websiteUrl: string;
    username: string;
    secret: string;
    actionNote: string;
  }) => void;
  initialService?: string;
  initialUrl?: string;
}

export const ExternalAuthModal: React.FC<ExternalAuthModalProps> = ({
  isOpen,
  onClose,
  onSubmitCredentials,
  initialService = '',
  initialUrl = '',
}) => {
  const [serviceName, setServiceName] = useState(initialService || 'External Portal');
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl || '');
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !secret.trim()) return;

    setIsSubmitting(true);
    onSubmitCredentials({
      serviceName: serviceName.trim() || 'External Web Portal',
      websiteUrl: websiteUrl.trim(),
      username: username.trim(),
      secret: secret.trim(),
      actionNote: actionNote.trim() || 'Execute automated web workflow with provided credentials',
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-neutral-50 via-white to-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-neutral-900">
                External Website Login & Credentials
              </h3>
              <p className="text-[11.5px] text-neutral-500">
                Provide login details for your AI agent to execute tasks on external sites
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="mx-6 mt-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 text-[12px] text-purple-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong>Secure Session Only:</strong> Credentials are used exclusively in this active workspace session to automate your requested task. They are never sent to third-party databases.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12.5px] font-bold text-neutral-700 mb-1">
              Website or Service Name
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Upwork, WordPress, Custom Portal"
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-neutral-700 mb-1">
              Website URL (Optional)
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com/login"
              className="w-full px-3 py-2 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-bold text-neutral-700 mb-1">
                Email or Username <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold text-neutral-700 mb-1">
                Password or API Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3 pr-9 py-2 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-neutral-700 mb-1">
              Instructions for Agent on this Website
            </label>
            <textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder="e.g. Login, check latest client proposal, and download the report..."
              rows={2}
              className="w-full px-3 py-2 text-[13px] border border-neutral-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !username.trim() || !secret.trim()}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-[13px] transition-all flex items-center gap-1.5 shadow-sm shadow-purple-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Submit & Let Agent Execute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
