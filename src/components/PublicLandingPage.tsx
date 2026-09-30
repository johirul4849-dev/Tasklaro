import React from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  HardDrive,
  Mail,
  Mic,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import heroImage from '../assets/images/workspace_hero_3d_1790765944789.jpg';

interface PublicLandingPageProps {
  onSignInWithGoogle: () => void;
  onEnterAsGuest: () => void;
  isLoggingIn: boolean;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  onSignInWithGoogle,
  onEnterAsGuest,
  isLoggingIn,
}) => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-purple-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient 3D Mesh Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[120px] left-[15%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-purple-400/20 via-indigo-300/15 to-transparent blur-3xl animate-pulse" />
        <div className="absolute top-[40px] right-[15%] w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-blue-400/20 via-emerald-300/15 to-transparent blur-3xl" />
        <div className="absolute top-[200px] left-[35%] w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-amber-300/15 via-rose-300/10 to-transparent blur-3xl" />
      </div>

      {/* Top Header - Clean, Focused (No Distracting Navigation Menu) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Bot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[19px] font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 bg-clip-text text-transparent">
              AgentFlow
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Workspace AI
            </span>
          </div>
        </div>

        {/* Top Direct Google Sign-In Button */}
        <button
          type="button"
          onClick={onSignInWithGoogle}
          disabled={isLoggingIn}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300/90 text-[13px] font-semibold transition-all shadow-xs hover:shadow-sm cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span>{isLoggingIn ? 'Connecting...' : 'Sign In'}</span>
        </button>
      </header>

      {/* Hero Section - Maximum Focus in Center */}
      <section className="relative z-10 pt-8 sm:pt-14 pb-16 px-5 sm:px-8 text-center max-w-5xl mx-auto">
        {/* Animated Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-purple-200/80 shadow-xs mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
          </span>
          <span className="text-[12.5px] font-semibold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">
            Autonomous Google Workspace Teammates · Active on Vercel
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight leading-[1.12] text-neutral-900 mb-6">
          Give real work to autonomous{' '}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            AI agents
          </span>{' '}
          in Google Workspace.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-9">
          AgentFlow connects directly to your <strong>Gmail, Calendar, Google Tasks, Docs, Sheets & Drive</strong>. It scans meetings, auto-converts timezones with 5-minute reminders, drafts verified emails, and creates executive research dossiers in seconds.
        </p>

        {/* Centerpiece Call to Action: Start Now with Google */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-4">
          <button
            type="button"
            onClick={onSignInWithGoogle}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[16px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-black/15 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoggingIn ? 'Connecting Google...' : 'Start Now with Google'}</span>
            <ArrowRight className="w-4 h-4 ml-1 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onEnterAsGuest}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200/90 font-semibold text-[14.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <span>Open Guest Workspace</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-neutral-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            100% Free · No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Direct Google OAuth 2.0 Security
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-purple-500" />
            Bengali & English Voice Input
          </span>
        </div>
      </section>

      {/* 3D Floating Interactive Workspace Hero Card */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <div className="group relative rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-white/90 to-white/60 border border-white/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_30px_70px_-15px_rgba(79,70,229,0.12)]">
          {/* Top macOS Style Window Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/[0.04] mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
              <span className="text-[12px] font-semibold text-neutral-400 ml-2">
                AgentFlow Virtual Workspace · Live Execution Engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Agent
              </span>
            </div>
          </div>

          {/* 3D Illustration Graphic Frame */}
          <div className="relative rounded-2xl overflow-hidden shadow-inner border border-black/[0.04]">
            <img
              src={heroImage}
              alt="Autonomous AI Agent Workspace"
              className="w-full h-auto object-cover max-h-[520px] transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Overlay Interactive Teaser Cards */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg text-left">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-[12px] mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Google Calendar</span>
                </div>
                <p className="text-[12.5px] font-medium text-neutral-800 leading-tight">
                  Auto-converts foreign timezones with 5-minute advance alerts.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg text-left">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-[12px] mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Docs & Sheets</span>
                </div>
                <p className="text-[12.5px] font-medium text-neutral-800 leading-tight">
                  Compiles verified research dossiers & 2D formatted spreadsheets.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg text-left">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-[12px] mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Gmail & Tasks</span>
                </div>
                <p className="text-[12.5px] font-medium text-neutral-800 leading-tight">
                  MIME file attachments and exact date/time Google Tasks sync.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Clear Steps */}
      <section className="py-20 px-5 sm:px-8 max-w-6xl mx-auto border-t border-neutral-200/70">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Work Smarter
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-3 mb-3">
            How AgentFlow Works in 3 Steps
          </h2>
          <p className="text-neutral-600 text-[15px]">
            No complex setup. Connect your tools once, and let your autonomous AI teammates do the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-7 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[18px] mb-5 border border-purple-100 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-[18px] font-bold text-neutral-900 mb-2">
              Connect Google Workspace
            </h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed">
              Authenticate via official Google Sign In. Grant access to Gmail, Calendar, Tasks, Docs, Sheets, and Drive securely.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-7 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[18px] mb-5 border border-indigo-100 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-[18px] font-bold text-neutral-900 mb-2">
              Command by Voice, Text or Files
            </h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed">
              Give tasks in natural Bengali or English. Drop a PDF/CSV to analyze, or use voice commands to trigger complex workflows.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-7 rounded-2xl bg-white border border-neutral-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[18px] mb-5 border border-emerald-100 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-[18px] font-bold text-neutral-900 mb-2">
              Autonomous Execution & Sync
            </h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed">
              AgentFlow executes real changes across your workspace, backs up memory to your Google Drive, and notifies you when done.
            </p>
          </div>
        </div>
      </section>

      {/* Cost & Speed Comparison vs Competitors */}
      <section className="py-20 px-5 sm:px-8 max-w-6xl mx-auto border-t border-neutral-200/70">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Unbeatable Value
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-3 mb-3">
            Why AgentFlow Beats Other AI Agents
          </h2>
          <p className="text-neutral-600 text-[15px]">
            Other AI agents charge hundreds of dollars per month with slow queues. AgentFlow is built for instant real-world output.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* AgentFlow Feature Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-50/60 via-indigo-50/40 to-white border-2 border-purple-300/80 shadow-lg shadow-purple-500/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full bg-purple-600 text-white font-bold text-[12px]">
                  AgentFlow (Our Platform)
                </span>
                <span className="text-[20px] font-extrabold text-purple-900">$0 / Free Core</span>
              </div>
              <h3 className="text-[22px] font-extrabold text-neutral-900 mb-4">
                Instant Execution in Your Tools
              </h3>
              <ul className="space-y-3.5 text-[14.5px] text-neutral-700 mb-6">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1-3 Second Response Time:</strong> Direct Gemini execution with no queue lag.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Google Integration:</strong> Real Gmail sends, Calendar events, Google Tasks, Docs & Sheets.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Bengali & English Voice:</strong> Speak directly to your bot with Web Speech audio recognition.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Private Cloud Storage:</strong> Backs up memory & rules directly to your personal Google Drive.</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={onSignInWithGoogle}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[14.5px] transition-colors cursor-pointer text-center shadow-md shadow-purple-600/20"
            >
              Get Started with Google Now
            </button>
          </div>

          {/* Competitors Card */}
          <div className="p-8 rounded-3xl bg-white border border-neutral-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 rounded-full bg-neutral-200 text-neutral-700 font-bold text-[12px]">
                  Traditional AI Agents & Coworkers
                </span>
                <span className="text-[18px] font-bold text-neutral-600">$20 - $500 / month</span>
              </div>
              <h3 className="text-[22px] font-bold text-neutral-800 mb-4">
                Slow Queues & Limited Tool Access
              </h3>
              <ul className="space-y-3.5 text-[14.5px] text-neutral-500 mb-6">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>30s - 3 Minute Wait Times:</strong> Complex spin-ups and heavy server queue waits.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>No Native Google Workspace:</strong> Requires Zapier, webhooks, or manual copy-pasting.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>English Only:</strong> Struggles with Bengali instructions or mixed bilingual commands.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span><strong>High Monthly Subscriptions:</strong> Expensive monthly plans before getting any real work done.</span>
                </li>
              </ul>
            </div>
            <div className="text-center py-2 text-[13px] text-neutral-400 font-medium">
              Save hundreds of dollars every month with AgentFlow.
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-5 sm:px-8 max-w-6xl mx-auto border-t border-neutral-200/70">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[12px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Engineered For Performance
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 mt-3 mb-3">
            Core Autonomous Capabilities
          </h2>
          <p className="text-neutral-600 text-[15px]">
            Designed from day one to handle real professional workflows without errors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              5-Minute Meeting Reminders
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Every scheduled event automatically arms an alert 5 minutes before start so you never miss a client call.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              Client Timezone Auto-Conversion
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Detects US EST, PST, or Europe CET in incoming messages and converts to your local Bangladesh time instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              Google Docs & Sheets Export
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Produces executive Markdown research reports and 2D formatted Excel/Sheets with direct download links.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              Instant Voice Command
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Speak in Bengali or English. The agent converts speech to structured workspace actions on the fly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Paperclip className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              File Attachment & Analysis
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Attach PDFs or spreadsheets. The agent can dispatch them via Gmail or analyze them into structured sheets.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="text-[16px] font-bold text-neutral-900 mb-1.5">
              Drive Synced Activity Memory
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Past tasks and meetings are remembered so your AI teammate gets smarter every time you work together.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom High-Impact CTA Banner */}
      <section className="py-20 px-5 sm:px-8 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to automate your Google Workspace?
            </h2>
            <p className="text-neutral-300 text-[16px] leading-relaxed">
              Connect in 1 click with your Google account. Your autonomous AI teammates are ready to execute work right now.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onSignInWithGoogle}
                disabled={isLoggingIn}
                className="px-8 py-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-[16px] transition-all inline-flex items-center gap-3 shadow-lg hover:scale-105 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Connecting...' : 'Start Now with Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-8 px-5 border-t border-neutral-200/60 text-center text-[12.5px] text-neutral-400 font-medium">
        AgentFlow · Autonomous Workspace AI Teammates · Connected with Google Workspace & Firebase
      </footer>
    </div>
  );
};
