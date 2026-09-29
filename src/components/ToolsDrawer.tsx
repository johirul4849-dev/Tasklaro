import React from 'react';
import { CheckCircle2, Lock, Monitor, ShieldCheck, X } from 'lucide-react';
import { ToolDefinition } from '../types/bot';

interface ToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolDefinition[];
  onToggleTool: (toolId: string) => void;
}

export const ToolsDrawer: React.FC<ToolsDrawerProps> = ({
  isOpen,
  onClose,
  tools,
  onToggleTool,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-full sm:w-[380px] border-l border-[#E6E6E4] bg-[#FBFBF9] flex flex-col h-full shrink-0">
      <div className="h-[52px] px-4 border-b border-[#E6E6E4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-neutral-900" />
          <span className="text-[14px] font-semibold text-neutral-900">
            Connected Tools & Browser Sessions
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <p className="text-[12px] text-neutral-500 leading-relaxed">
          Grok Bots sign in to your enterprise tools just like human teammates. If a tool is disconnected, the bot pauses and asks you to sign in before continuing.
        </p>

        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl bg-white overflow-hidden">
          {tools.map((tool) => (
            <div key={tool.id} className="p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tool.signedIn ? '#16A34A' : '#D97706' }}
                  />
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {tool.name}
                  </span>
                  <span className="text-[11px] text-neutral-400">· {tool.category}</span>
                </div>
                <div className="text-[11.5px] text-neutral-500 mt-1 leading-snug">
                  {tool.description}
                </div>
                <div className="text-[11px] font-mono text-neutral-400 mt-1">
                  {tool.signedIn ? `Account: ${tool.account}` : 'Disconnected · Bot will request sign-in'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleTool(tool.id)}
                className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors shrink-0 cursor-pointer ${
                  tool.signedIn
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                {tool.signedIn ? 'Signed In' : 'Sign In'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
