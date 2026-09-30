import React, { useState } from 'react';
import { Bot, Check, Sparkles, X } from 'lucide-react';
import { AvatarShape, BotTeammate } from '../types/bot';

interface HireBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBotHired: (bot: BotTeammate) => void;
}

interface RoleTemplate {
  title: string;
  badge: string;
  prompt: string;
  tools: string[];
}

const PRESET_IDEAS: RoleTemplate[] = [
  {
    title: '📅 এক্সিকিউটিভ ক্যালেন্ডার ও মিটিং শিডিউলার',
    badge: 'Executive',
    prompt: 'Check Gmail for meeting invites, convert foreign client timezones (EST/CET/GMT) to local time, add events to Google Calendar with 5-minute alerts, mark emails as read to prevent duplicates, and send instant confirmation replies.',
    tools: ['Google Calendar', 'Gmail', 'Web Search'],
  },
  {
    title: '📬 জিমেইল ইনবক্স জিরো স্পেশালিস্ট',
    badge: 'Email Lead',
    prompt: 'Clean and manage my Gmail inbox: scan unread messages, categorize urgent business emails, filter noise, mark processed threads as read, and draft clean replies in my voice.',
    tools: ['Gmail', 'Google Tasks'],
  },
  {
    title: '📊 গুগল শিটস ও ফিনান্সিয়াল অ্যানালিস্ট',
    badge: 'Sheets & Data',
    prompt: 'Create, update, and analyze formatted Google Sheets: calculate revenue, build formulas, extract metrics from emails or attachments, and export downloadable CSV spreadsheets.',
    tools: ['Google Sheets', 'Google Docs', 'Web Search'],
  },
  {
    title: '📑 গুগল ডক্স ও বিজনেস রিসার্চার',
    badge: 'Research',
    prompt: 'Conduct deep market research on web, compile comprehensive executive dossiers in Google Docs with structured headings, bullet points, metrics, and data tables.',
    tools: ['Google Docs', 'Google Sheets', 'Web Search'],
  },
  {
    title: '🎯 গুগল টাস্কস ও ডেইলি প্রায়োরিটি ট্র্যাকার',
    badge: 'Tasks & Org',
    prompt: 'Extract action items from meetings and conversations, schedule them in Google Tasks with exact dates and times, monitor deadlines, and update status.',
    tools: ['Google Tasks', 'Google Calendar'],
  },
  {
    title: '🤝 ক্লায়েন্ট আউটরিচ ও লিড ফলো-আপ',
    badge: 'Sales & Client',
    prompt: 'Draft high-converting personalized outreach emails, schedule follow-up reminders in Google Calendar, track prospect communications, and send verified attachments.',
    tools: ['Gmail', 'Google Sheets', 'Google Calendar'],
  },
  {
    title: '🌐 ওয়েব অটোমেশন ও এক্সটার্নাল পোর্টাল এজেন্ট',
    badge: 'Web Agent',
    prompt: 'Log into external portals and client websites using provided credentials, perform automated form submissions, verify data updates, and report back.',
    tools: ['Web Search', 'Terminal', 'Gmail'],
  },
  {
    title: '📈 স্টক ও ট্রেডিং ইন্টেলিজেন্স অ্যানালিস্ট',
    badge: 'Trading & Market',
    prompt: 'Track Dhaka Stock Exchange (DSE), crypto, and global markets, analyze top trading influencers, build price watchlists in Google Sheets, and summarize technical news.',
    tools: ['Google Sheets', 'Google Docs', 'Web Search'],
  },
  {
    title: '💡 পার্সোনাল চিফ অব স্টাফ (Chief of Staff)',
    badge: 'All-in-One',
    prompt: 'Autonomous general assistant: manage Gmail, schedule Calendar events with 5-minute alerts, organize Google Tasks, write Google Docs reports, and advise on executive decisions in Bengali and English.',
    tools: ['Gmail', 'Google Calendar', 'Google Tasks', 'Google Docs', 'Google Sheets', 'Web Search'],
  },
  {
    title: '📝 দ্বিভাষিক অনুবাদ ও ডকুমেন্ট এডিটর',
    badge: 'Editor & Copy',
    prompt: 'Translate documents seamlessly between Bengali and English, refine corporate correspondence, proofread emails, and format official Google Docs with professional polish.',
    tools: ['Google Docs', 'Gmail'],
  },
];

const AVAILABLE_TOOLS = [
  'Google Sheets',
  'Gmail',
  'Salesforce',
  'LinkedIn',
  'GitHub',
  'Terminal',
  'Ramp',
  'Web Search',
];

const COLORFUL_AVATARS: Array<{ shape: AvatarShape; color: string }> = [
  { shape: 'violet-gem', color: '#8B5CF6' },
  { shape: 'sunset-coral', color: '#F43F5E' },
  { shape: 'cyan-orb', color: '#06B6D4' },
  { shape: 'emerald-badge', color: '#10B981' },
  { shape: 'amber-star', color: '#F59E0B' },
  { shape: 'neon-magenta', color: '#EC4899' },
  { shape: 'circle-teal', color: '#2CB696' },
  { shape: 'triangle-blue', color: '#3562F4' },
  { shape: 'diamond-purple', color: '#7A49F5' },
  { shape: 'circle-orange', color: '#F29938' },
];

export const HireBotModal: React.FC<HireBotModalProps> = ({
  isOpen,
  onClose,
  onBotHired,
}) => {
  const [requirementPrompt, setRequirementPrompt] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'Google Sheets',
    'Gmail',
    'Web Search',
  ]);
  const [isHiring, setIsHiring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementPrompt.trim() || isHiring) return;

    setIsHiring(true);
    setErrorMessage(null);

    try {
      let spec: any = null;
      try {
        const res = await fetch('/api/agent/hire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirementPrompt }),
        });
        if (res.ok) {
          spec = await res.json().catch(() => null);
        }
      } catch (netErr) {
        console.warn('Fetch /api/agent/hire error, using client fallback', netErr);
      }

      if (!spec || !spec.name) {
        const isBengali = /[\u0980-\u09FF]/.test(requirementPrompt);
        spec = {
          name: isBengali ? 'ওয়ার্কস্পেস সহকারী' : 'Workspace Teammate',
          role: requirementPrompt.slice(0, 40) || 'Autonomous Specialist',
          description: requirementPrompt,
          welcomeMessage: isBengali
            ? `হ্যালো! আমি আপনার সহকারী হিসেবে প্রস্তুত। জিমেইল, ক্যালেন্ডার, টাস্ক, ডক্স বা শিটে কী কাজ করতে হবে বলুন।`
            : `Hello! I am ready to handle your tasks in Google Workspace. What would you like to start with?`,
        };
      }

      const nowTime = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

      // Pick a random vibrant avatar from COLORFUL_AVATARS if not specified
      const randomAvatar = COLORFUL_AVATARS[Math.floor(Math.random() * COLORFUL_AVATARS.length)];

      const newBot: BotTeammate = {
        id: `bot-${Date.now()}`,
        name: spec.name || 'AI Teammate',
        role: spec.role || 'Autonomous Teammate',
        avatarShape: spec.avatarShape || randomAvatar.shape,
        color: spec.color || randomAvatar.color,
        description: spec.description || requirementPrompt,
        requiredTools: spec.requiredTools || selectedTools,
        timestamp: nowTime,
        sidebarPreview: spec.welcomeMessage || 'Ready for assignments.',
        timeline: [
          {
            id: `time-${Date.now()}`,
            kind: 'timestamp',
            text: nowTime,
          },
          {
            id: `msg-${Date.now()}`,
            kind: 'bot',
            text: spec.welcomeMessage || `Hey! I am set up as your ${spec.name}. What would you like me to tackle on my computer first?`,
          },
        ],
      };

      onBotHired(newBot);
      setRequirementPrompt('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error hiring bot. Please try again.');
    } finally {
      setIsHiring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-neutral-900">
                Hire a New AI Teammate
              </h3>
              <p className="text-[12px] text-neutral-500">
                Describe the role or condition; Gemini will hire and calibrate an autonomous bot.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleHireSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-neutral-800 mb-1.5">
              What real work do you want this bot to own?
            </label>
            <textarea
              value={requirementPrompt}
              onChange={(e) => setRequirementPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. 'আমার একটি সেলস আউটবাউন্ড বট দরকার যারা গুগল শিট ও লিঙ্কডইন থেকে লিড রিসার্চ করে সিকোয়েন্স ড্রাফট করবে' or 'I need a customer success bot to scan tickets and pull product telemetry'..."
              className="w-full p-3 rounded-xl border border-neutral-300 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 leading-relaxed"
              required
            />
          </div>

          {/* Quick Idea Presets */}
          <div>
            <div className="text-[12px] font-medium text-neutral-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              <span>Or click a role template ({PRESET_IDEAS.length} Ready Templates):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {PRESET_IDEAS.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRequirementPrompt(idea.prompt);
                    if (idea.tools && idea.tools.length > 0) {
                      setSelectedTools(idea.tools);
                    }
                  }}
                  className="text-left p-2.5 rounded-xl border border-neutral-200 hover:border-purple-600 hover:bg-purple-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[12px] font-bold text-neutral-900 group-hover:text-purple-700 truncate">
                      {idea.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70 shrink-0">
                      {idea.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 line-clamp-2 leading-snug">
                    {idea.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tools needed */}
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 mb-1.5">
              Tools this bot can access:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TOOLS.map((tool) => {
                const isSelected = selectedTools.includes(tool);
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{tool}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[12px]">
              {errorMessage}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!requirementPrompt.trim() || isHiring}
              className="px-5 py-2 rounded-xl text-[13px] font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isHiring ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Hiring & Calibrating Bot...</span>
                </>
              ) : (
                <span>Hire AI Teammate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
