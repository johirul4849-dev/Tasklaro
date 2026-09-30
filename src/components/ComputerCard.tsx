import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Mail,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { ComputerSessionData, ToolDefinition, WorkspaceArtifact } from '../types/bot';
import { WorkspaceActionPanel } from './WorkspaceActionPanel';
import { downloadFile } from '../services/workspaceService';

interface ComputerCardProps {
  session: ComputerSessionData;
  connectedTools: ToolDefinition[];
  googleToken?: string | null;
  onRequireGoogleLogin?: () => void;
  onSignInTool: (toolName: string) => void;
  onApproveDeliverableItem: (sessionId: string, itemId: string) => void;
  onArtifactCreated?: (artifact: WorkspaceArtifact) => void;
  onRequestExternalAuth?: () => void;
}

export const ComputerCard: React.FC<ComputerCardProps> = ({
  session,
  connectedTools,
  googleToken = null,
  onRequireGoogleLogin = () => {},
  onSignInTool,
  onApproveDeliverableItem,
  onArtifactCreated,
  onRequestExternalAuth = () => {},
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const targetTool = session.targetTool || session.appName;
  const isNeedsPermission = session.status === 'needs_permission' && !isApproved;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadItem = (item: any) => {
    const filename = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`;
    downloadFile(filename, `${item.title}\n${item.subtitle || ''}\n\n${item.content}`);
  };

  const getToolIcon = (toolName: string) => {
    const lower = toolName.toLowerCase();
    if (lower.includes('gmail') || lower.includes('mail')) return <Mail className="w-3.5 h-3.5 text-blue-600" />;
    if (lower.includes('calendar')) return <Clock className="w-3.5 h-3.5 text-purple-600" />;
    if (lower.includes('task')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    if (lower.includes('sheet') || lower.includes('excel')) return <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />;
    if (lower.includes('doc')) return <FileText className="w-3.5 h-3.5 text-blue-500" />;
    if (lower.includes('web')) return <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />;
    return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/90 w-full max-w-[980px] my-2 shadow-xs font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200/80">
            {getToolIcon(session.targetTool || session.appName)}
          </div>
          <div>
            <h4 className="text-[14.5px] font-bold text-neutral-900 flex items-center gap-2">
              <span>{session.appName || 'AgentFlow Autonomous Pipeline'}</span>
              <span className="text-[11px] font-medium text-neutral-400">· Real-time Execution</span>
            </h4>
            <p className="text-[12.5px] text-neutral-600 font-medium leading-tight mt-0.5">
              {session.actionSummary}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isNeedsPermission ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Confirmation Needed
            </span>
          ) : session.status === 'running' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              Executing Steps
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              Completed & Verified
            </span>
          )}
        </div>
      </div>

      {/* Sequential Execution Steps List (Clean, No Bulky Simulated Screen) */}
      {session.steps && session.steps.length > 0 && (
        <div className="mt-3.5 space-y-2">
          <div className="text-[11.5px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Terminal className="w-3 h-3" />
            <span>Execution Timeline ({session.steps.length} Steps)</span>
          </div>

          <div className="space-y-1.5">
            {session.steps.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/80 hover:bg-neutral-100/70 border border-neutral-150 transition-colors text-[12.5px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-white border border-neutral-300 flex items-center justify-center text-[10.5px] font-bold text-neutral-600 shrink-0">
                    {st.order || idx + 1}
                  </span>
                  <div className="flex items-center gap-2 truncate">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-neutral-700 font-semibold text-[11px] border border-neutral-200/80 shrink-0">
                      {getToolIcon(st.tool)}
                      <span>{st.tool}</span>
                    </span>
                    <span className="font-semibold text-neutral-800">{st.action}:</span>
                    <span className="text-neutral-600 truncate">{st.detail}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {st.duration && (
                    <span className="text-[10.5px] text-neutral-400 font-mono">
                      {st.duration}
                    </span>
                  )}
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permission / Confirmation Required Banner */}
      {isNeedsPermission && (
        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-bold">Action Ready for User Confirmation</div>
              <p className="text-[12px] text-amber-800 leading-snug">
                The agent has formulated the task and is awaiting your approval before finalizing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestExternalAuth}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-800 border border-amber-300 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>Provide Credentials</span>
            </button>
            <button
              type="button"
              onClick={() => setIsApproved(true)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Approve & Proceed</span>
            </button>
          </div>
        </div>
      )}

      {/* Finished Deliverable Packages (e.g. Google Docs / Sheets Research) */}
      {session.deliverable && session.deliverable.items && session.deliverable.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
              <span>{session.deliverable.title}</span>
            </span>
            <span className="text-[11px] font-medium text-neutral-500">
              {session.deliverable.items.length} Files Ready
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {session.deliverable.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/90 hover:bg-white hover:border-neutral-300 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-[13.5px] font-bold text-neutral-900">{item.title}</h5>
                    {item.channel && (
                      <span className="inline-block mt-0.5 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60">
                        {item.channel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id || String(idx), item.content)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === (item.id || String(idx)) ? (
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
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {item.content && (
                  <pre className="text-[11.5px] text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200/70 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                    {item.content}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Workspace Action Panel (Calendar, Gmail, Tasks, Docs & Sheets triggers) */}
      <div className="mt-3">
        <WorkspaceActionPanel
          actionType={session.actionType}
          actionPayload={session.actionPayload}
          googleToken={googleToken}
          onRequireGoogleLogin={onRequireGoogleLogin}
          onArtifactCreated={onArtifactCreated}
        />
      </div>
    </div>
  );
};
