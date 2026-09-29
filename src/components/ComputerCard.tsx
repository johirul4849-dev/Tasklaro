import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { ComputerSessionData, ToolDefinition, WorkspaceArtifact } from '../types/bot';
import { WorkspaceActionPanel } from './WorkspaceActionPanel';
import { downloadFile, exportToCsv } from '../services/workspaceService';

interface ComputerCardProps {
  session: ComputerSessionData;
  connectedTools: ToolDefinition[];
  googleToken?: string | null;
  onRequireGoogleLogin?: () => void;
  onSignInTool: (toolName: string) => void;
  onApproveDeliverableItem: (sessionId: string, itemId: string) => void;
  onArtifactCreated?: (artifact: WorkspaceArtifact) => void;
}

export const ComputerCard: React.FC<ComputerCardProps> = ({
  session,
  connectedTools,
  googleToken = null,
  onRequireGoogleLogin = () => {},
  onSignInTool,
  onApproveDeliverableItem,
  onArtifactCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'screen' | 'steps' | 'deliverables'>(
    session.status === 'done' && session.deliverable && session.deliverable.items.length > 0
      ? 'deliverables'
      : 'screen'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const targetTool = session.targetTool || session.appName;
  const isNeedsSignIn = session.status === 'needs_signin';

  const handleInteractiveSignIn = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      onSignInTool(targetTool);
      setIsSigningIn(false);
    }, 700);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadItem = (item: any) => {
    const filename = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    downloadFile(filename, `${item.title}\n${item.subtitle || ''}\n\n${item.content}`);
  };

  return (
    <div className="bg-[#F3F3F2] rounded-[22px] p-4 sm:p-6 border border-black/[0.06] w-full max-w-[1020px] my-1 shadow-xs">
      {/* Top Header Row matching 47.jpg */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[16px] font-bold text-[#111111]">Autonomous Cloud Computer</span>
        </div>

        {/* Status Pill */}
        <div>
          {isNeedsSignIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium bg-[#FEF3C7] text-[#B45309]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              Waiting for Sign In
            </span>
          ) : session.status === 'running' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium bg-[#DBEAFE] text-[#1D4ED8]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Running
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-medium bg-[#DCFCE7] text-[#15803D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              Work Complete
            </span>
          )}
        </div>
      </div>

      {/* Subtitle matching 47.jpg */}
      <p className="text-[15px] sm:text-[15.5px] font-medium text-[#27272A] mt-1 mb-4 leading-relaxed">
        {session.actionSummary}
      </p>

      {/* Blue Textured Desktop Canvas matching 47.jpg */}
      <div
        className="rounded-[16px] p-4 sm:p-6 relative overflow-hidden border border-black/10 shadow-inner"
        style={{
          backgroundColor: '#4B83AC',
          backgroundImage: `radial-gradient(rgba(255,255,255,0.12) 1px, transparent 0), radial-gradient(rgba(0,0,0,0.08) 1px, transparent 0)`,
          backgroundSize: '6px 6px',
          backgroundPosition: '0 0, 3px 3px',
        }}
      >
        {/* Browser Window inside the Bot's Cloud Desktop */}
        <div className="bg-white rounded-xl shadow-lg border border-black/15 overflow-hidden">
          {/* Mini Browser Top Bar */}
          <div className="bg-[#F8FAFC] border-b border-neutral-200 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
            </div>

            <div className="flex-1 max-w-[380px] bg-white border border-neutral-200 rounded-md px-2 py-0.5 flex items-center gap-1.5 text-[11.5px] text-neutral-500 font-mono truncate">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{session.url}</span>
            </div>

            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-md shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('screen')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  activeTab === 'screen' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Screen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('steps')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors tabular-nums ${
                  activeTab === 'steps' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Steps ({session.steps.length})
              </button>
              {session.deliverable && (
                <button
                  type="button"
                  onClick={() => setActiveTab('deliverables')}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors tabular-nums ${
                    activeTab === 'deliverables' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  Work ({session.deliverable.items.length})
                </button>
              )}
            </div>
          </div>

          {/* Browser Viewport Content */}
          {activeTab === 'screen' && (
            <div className="p-4 sm:p-5 bg-white">
              {isNeedsSignIn ? (
                /* Interactive Sign-in Handoff */
                <div className="max-w-[340px] mx-auto py-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                    {targetTool.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-[14.5px] font-semibold text-neutral-900">
                    Sign in to {targetTool}
                  </h4>
                  <p className="text-[12px] text-neutral-500 mt-1 mb-3.5">
                    Your bot paused so you can authenticate safely inside its isolated cloud browser.
                  </p>

                  <button
                    type="button"
                    onClick={handleInteractiveSignIn}
                    disabled={isSigningIn}
                    className="w-full py-2 px-4 rounded-lg bg-[#111111] hover:bg-neutral-800 text-white text-[12.5px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSigningIn ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Authenticating & Resuming Bot...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign in to {targetTool} & Resume</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Live Screen Display */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <div>
                      <div className="text-[13px] font-semibold text-neutral-900">
                        {session.screenView.title || session.appName}
                      </div>
                      <div className="text-[11.5px] text-neutral-500">
                        {session.screenView.details}
                      </div>
                    </div>
                    {session.deliverable && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('deliverables')}
                        className="text-[11.5px] text-blue-600 hover:underline font-medium"
                      >
                        Inspect Work Output →
                      </button>
                    )}
                  </div>

                  {/* Metrics if present */}
                  {session.screenView.metrics && session.screenView.metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {session.screenView.metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/70 text-center">
                          <div className="text-[10.5px] text-neutral-400 font-medium">{m.label}</div>
                          <div className="text-[13px] font-bold text-neutral-900 tabular-nums">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw Output / Code / Logs */}
                  {session.screenView.rawOutput && (
                    <div className="bg-[#18181B] text-[#FAFAFA] rounded-lg p-3 font-mono text-[12px] leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                      {session.screenView.rawOutput}
                    </div>
                  )}

                  {/* Highlights from Deliverables if present */}
                  {session.deliverable && session.deliverable.items.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                      <div className="text-[12px] font-semibold text-neutral-800 flex items-center justify-between">
                        <span>{session.deliverable.title}</span>
                        <span className="text-[11px] text-neutral-400 font-normal">
                          {session.deliverable.items.length} items ready
                        </span>
                      </div>
                      <div className="space-y-1">
                        {session.deliverable.items.slice(0, 3).map((it) => (
                          <div
                            key={it.id}
                            className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-[12px] flex items-center justify-between gap-2"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-neutral-900">{it.title}</span>
                              {it.subtitle && (
                                <span className="text-neutral-500 ml-1.5">· {it.subtitle}</span>
                              )}
                            </div>
                            <span className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                              {it.status || 'Ready'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Steps Tab */}
          {activeTab === 'steps' && (
            <div className="p-4 bg-white divide-y divide-neutral-100 max-h-[300px] overflow-y-auto">
              {session.steps.map((step) => (
                <div key={step.order} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-[11px] text-neutral-400 mt-0.5 tabular-nums">
                      0{step.order}.
                    </span>
                    <div>
                      <div className="text-[12.5px] font-medium text-neutral-900">
                        <span className="font-semibold">{step.tool}</span> — {step.action}
                      </div>
                      <div className="text-[12px] text-neutral-500 mt-0.5">{step.detail}</div>
                    </div>
                  </div>
                  {step.duration && (
                    <span className="font-mono text-[11px] text-neutral-400 shrink-0 tabular-nums">
                      {step.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Deliverables Tab - Professional & Colorful Finished Report */}
          {activeTab === 'deliverables' && session.deliverable && (
            <div className="p-4 sm:p-5 bg-white space-y-4 max-h-[460px] overflow-y-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-400 text-neutral-950">
                      Finished Report
                    </span>
                    <span className="text-[12px] text-neutral-300 font-mono">
                      {session.deliverable.items.length} Deliverable Items
                    </span>
                  </div>
                  <h4 className="text-[16px] font-bold tracking-tight text-white">
                    {session.deliverable.title}
                  </h4>
                  <p className="text-[12.5px] text-neutral-300 leading-snug">
                    {session.deliverable.summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-xs text-[12px] font-semibold text-white border border-white/15">
                    ✓ Verified by Grok Bot
                  </span>
                </div>
              </div>

              {session.deliverable.items.map((item, idx) => {
                const colorBorders = ['border-l-indigo-500', 'border-l-emerald-500', 'border-l-purple-500', 'border-l-blue-500'];
                const accentBorder = colorBorders[idx % colorBorders.length];
                return (
                <div key={item.id} className={`rounded-xl border border-neutral-200/90 p-3.5 bg-[#FAFAFA] space-y-2.5 border-l-4 ${accentBorder}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-bold text-neutral-900 flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.channel && (
                          <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                            {item.channel}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11.5px] text-neutral-500">{item.subtitle}</div>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${item.approved ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-neutral-700 border-neutral-200'}`}>
                      {item.approved ? '✓ Approved' : item.status || 'Ready'}
                    </span>
                  </div>

                  <pre className="text-[12.5px] text-neutral-800 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-neutral-200/80 leading-relaxed shadow-2xs">
                    {item.content}
                  </pre>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.content)}
                        className="text-[11.5px] font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-200/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item)}
                        className="text-[11.5px] font-medium text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-200/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onApproveDeliverableItem(session.id, item.id)}
                      disabled={item.approved}
                      className={`px-3 py-1 rounded-lg text-[11.5px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                        item.approved
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-[#111111] text-white hover:bg-neutral-800'
                      }`}
                    >
                      {item.approved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Approve & Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Workspace Action Automation Panel */}
      <WorkspaceActionPanel
        actionType={session.actionType}
        actionPayload={session.actionPayload}
        googleToken={googleToken}
        onRequireGoogleLogin={onRequireGoogleLogin}
        onArtifactCreated={onArtifactCreated}
      />

      {/* Footer link to switch view */}
      {session.deliverable && (
        <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#52525B] px-1">
          <span>
            {session.deliverable.title} ·{' '}
            <span className="font-semibold text-neutral-900 tabular-nums">
              {session.deliverable.items.length} items
            </span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'deliverables' ? 'screen' : 'deliverables')}
            className="font-medium text-[#111111] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{activeTab === 'deliverables' ? 'Back to Screen' : 'Review Deliverables'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
