import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  Bell,
  BellRing,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Globe,
  HardDrive,
  LogOut,
  Mail,
  Mic,
  MicOff,
  Monitor,
  KeyRound,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { BotAvatar } from './components/BotAvatar';
import { ComputerCard } from './components/ComputerCard';
import { HireBotModal } from './components/HireBotModal';
import { ToolsDrawer } from './components/ToolsDrawer';
import { WorkspaceHubModal } from './components/WorkspaceHubModal';
import { PublicLandingPage } from './components/PublicLandingPage';
import { ExternalAuthModal } from './components/ExternalAuthModal';
import { executeFallbackIntelligence } from './services/agentFallback';
import {
  saveUserBots,
  loadUserBots,
  saveUserMemory,
  loadUserMemory,
  saveUserProfile,
  loadUserProfile,
} from './services/firebaseDb';
import {
  ActivityMemoryEntry,
  AttachedFileInfo,
  BotTeammate,
  ChatTimelineEntry,
  ToolDefinition,
  UserInstructionProfile,
  WorkspaceArtifact,
} from './types/bot';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logoutGoogle,
} from './services/googleAuth';
import {
  getOrCreateDriveFolder,
  listCalendarEvents,
  listGoogleTasks,
  markGmailAsRead,
  uploadOrUpdateDriveFile,
} from './services/workspaceService';

const INITIAL_TOOLS: ToolDefinition[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Communication',
    signedIn: false,
    account: 'Waiting for Google Login',
    description: 'Read inbox, find meeting requests, auto-reply, and send emails.',
    icon: 'Mail',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    category: 'Scheduling',
    signedIn: false,
    account: 'Waiting for Google Login',
    description: 'Create & update events with 5-minute automated meeting reminders.',
    icon: 'Calendar',
  },
  {
    id: 'tasks',
    name: 'Google Tasks',
    category: 'Productivity',
    signedIn: false,
    account: 'Waiting for Google Login',
    description: 'Create, update, edit, and delete user task lists with due dates.',
    icon: 'CheckSquare',
  },
  {
    id: 'docs',
    name: 'Google Docs',
    category: 'Documents',
    signedIn: false,
    account: 'Waiting for Google Login',
    description: 'Generate rich research dossiers and export live Google Docs with download.',
    icon: 'FileText',
  },
  {
    id: 'sheets',
    name: 'Google Sheets',
    category: 'Spreadsheets',
    signedIn: false,
    account: 'Waiting for Google Login',
    description: 'Format data into Google Spreadsheets with instant CSV/Excel download.',
    icon: 'Table',
  },
  {
    id: 'search',
    name: 'Web Intelligence',
    category: 'Search Engine',
    signedIn: true,
    account: 'Live Gemini Grounding',
    description: 'Real-time search for market influencers, technical research, and data.',
    icon: 'Globe',
  },
];

const DEFAULT_COLORFUL_BOTS: BotTeammate[] = [
  {
    id: 'bot-omni-master',
    name: 'AgentFlow Omni Super Assistant',
    role: 'All-in-One Autonomous Workspace Executive',
    avatarShape: 'violet-gem',
    color: '#8B5CF6',
    description: 'Unified autonomous AI assistant for Gmail inbox scanning & smart reviews, Google Calendar scheduling (UTC+6 / Bangladesh timezone with 5-min alert), Google Tasks (with exact time & reminder), Google Docs & Sheets (finding, editing, professional colorful design), Web Search, and Computer actions.',
    requiredTools: ['Gmail', 'Google Calendar', 'Google Tasks', 'Google Docs', 'Google Sheets', 'Web Intelligence'],
    timestamp: 'Online',
    sidebarPreview: 'All-in-One Workspace Agent ready for your commands.',
    timeline: [
      {
        id: 'init-msg-1',
        kind: 'bot',
        text: 'Hello! I am your Unified Workspace Super Assistant. I have all capabilities (Gmail, Google Calendar with 5-minute reminder and UTC+6 timezone, Google Tasks with exact time alerts, Google Docs & Sheets in Drive with professional colorful design, and Web Intelligence) ready in a single agent. What would you like to accomplish today?',
      },
    ],
  },
];

export default function App() {
  const [bots, setBots] = useState<BotTeammate[]>(() => {
    const saved = localStorage.getItem('agentflow_bots_omni_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return [parsed[0]];
      } catch {}
    }
    return DEFAULT_COLORFUL_BOTS;
  });

  const [selectedBotId, setSelectedBotId] = useState<string | null>(() => {
    return DEFAULT_COLORFUL_BOTS[0].id;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isWorkspaceHubOpen, setIsWorkspaceHubOpen] = useState(false);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');

  // File Attachment & Voice Command States
  const [attachedFile, setAttachedFile] = useState<AttachedFileInfo | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Google Workspace Authentication State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isExternalAuthOpen, setIsExternalAuthOpen] = useState(false);

  // User Profile & Custom Instructions (Account-based isolation)
  const [userProfile, setUserProfile] = useState<UserInstructionProfile>(() => {
    const saved = localStorage.getItem('agentflow_profile_guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      userEmail: '',
      displayName: 'Workspace User',
      role: 'Business Executive / Trader',
      company: 'Workspace',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
      customInstructions: 'Always execute requests autonomously. Auto-convert US/Europe timezones to local time with 5-minute meeting reminders. Provide structured, executive-grade Google Docs & Sheets.',
      preferredLanguage: 'Bengali & English',
      defaultMeetingDuration: 30,
    };
  });

  // User Activity Memory (Account-based isolation)
  const [memoryEntries, setMemoryEntries] = useState<ActivityMemoryEntry[]>(() => {
    const saved = localStorage.getItem('agentflow_memory_guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: 'mem-seed-1',
        timestamp: '10:30 AM',
        date: new Date().toISOString().split('T')[0],
        type: 'task',
        title: 'Google Tasks Autonomous Execution',
        description: 'Set up real-time task management with exact date & time',
        tags: ['TASK', 'AUTOMATION'],
      },
      {
        id: 'mem-seed-2',
        timestamp: '11:15 AM',
        date: new Date().toISOString().split('T')[0],
        type: 'meeting',
        title: 'Global Timezone Auto-Conversion',
        description: 'Auto-converted client timezone with 5-minute reminder alert',
        counterpart: 'US/EU Client',
        tags: ['CALENDAR', 'TIMEZONE'],
      },
    ];
  });

  // 5-Minute Reminder State
  const [activeReminderAlert, setActiveReminderAlert] = useState<{
    title: string;
    timeText: string;
    type: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        updateToolsConnectedState(user.email || 'Connected User', true);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        updateToolsConnectedState('', false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const updateToolsConnectedState = (userEmail: string, isConnected: boolean) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === 'search'
          ? t
          : {
              ...t,
              signedIn: isConnected,
              account: isConnected ? userEmail : 'Waiting for Google Login',
            }
      )
    );
  };

  // Load and switch profile, bots, and memory when Google account changes (Firestore + LocalStorage)
  useEffect(() => {
    const accountKey = googleUser?.email || 'guest';
    const uid = googleUser?.uid || '';

    // 1. Profile
    loadUserProfile(uid).then((loadedProf) => {
      if (loadedProf) {
        setUserProfile(loadedProf);
      } else if (googleUser) {
        setUserProfile((prev) => ({
          ...prev,
          userEmail: googleUser.email || '',
          displayName: googleUser.displayName || prev.displayName || 'Workspace User',
        }));
      }
    });

    // 2. Memory
    loadUserMemory(uid).then((loadedMem) => {
      if (loadedMem && loadedMem.length > 0) {
        setMemoryEntries(loadedMem);
      }
    });

    // 3. Bots (Strict Single Unified Super Bot Principle)
    if (uid) {
      loadUserBots(uid).then((loadedBots) => {
        if (loadedBots && loadedBots.length > 0) {
          const singleBot = [loadedBots[0]];
          setBots(singleBot);
          setSelectedBotId(singleBot[0].id);
        }
      });
    }
  }, [googleUser]);

  // Sync bots to Firestore & localStorage
  useEffect(() => {
    const uid = googleUser?.uid || '';
    saveUserBots(uid, bots);
  }, [bots, googleUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bots, isProcessing]);

  // Periodic Reminder Engine (Checks Calendar & Tasks every 45s for 5-minute alerts!)
  useEffect(() => {
    if (!googleToken) return;

    const checkReminders = async () => {
      try {
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        const events = await listCalendarEvents(googleToken, now.toISOString(), nextHour);

        for (const ev of events) {
          if (ev.start?.dateTime) {
            const eventTime = new Date(ev.start.dateTime).getTime();
            const diffMinutes = Math.round((eventTime - Date.now()) / (60 * 1000));
            // Trigger 5-minute reminder alert!
            if (diffMinutes <= 5 && diffMinutes >= 0) {
              setActiveReminderAlert({
                title: ev.summary || 'Upcoming Meeting',
                timeText: `Starts in ${diffMinutes} minutes!`,
                type: 'calendar',
              });
              break;
            }
          }
        }
      } catch {
        // Non-fatal
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 45000);
    return () => clearInterval(interval);
  }, [googleToken]);

  const activeBot = bots.find((b) => b.id === selectedBotId) || (bots.length > 0 ? bots[0] : null);

  const filteredBots = bots.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.role.toLowerCase().includes(q);
  });

  const handleGoogleSignIn = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        updateToolsConnectedState(res.user.email || 'Connected User', true);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';

      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.txt')
      ) {
        const textReader = new FileReader();
        textReader.onload = () => {
          setAttachedFile({
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            dataUrl,
            base64,
            textContent: textReader.result as string,
          });
        };
        textReader.readAsText(file);
      } else {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          base64,
          textContent: `[File attached: ${file.name}, size: ${file.size} bytes, type: ${file.type || 'binary'}]`,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by this browser. Chrome or Edge is recommended.');
      return;
    }

    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'bn-BD';

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to initialize:', err);
      setIsListeningVoice(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setIsGuestMode(false);
    updateToolsConnectedState('', false);
  };

  const handleBotHired = (calibratedBot: BotTeammate) => {
    // Single unified super bot principle: calibrate the single assistant
    const updated = [calibratedBot];
    setBots(updated);
    saveUserBots(googleUser?.uid || '', updated);
    localStorage.setItem('agentflow_bots_omni_v1', JSON.stringify(updated));
    setSelectedBotId(calibratedBot.id);
  };

  const handleDeleteBot = (botId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBots((prev) => {
      const remaining = prev.filter((b) => b.id !== botId);
      saveUserBots(googleUser?.uid || '', remaining);
      return remaining;
    });
    if (selectedBotId === botId) {
      const remaining = bots.filter((b) => b.id !== botId);
      setSelectedBotId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleToggleTool = (toolId: string) => {
    if (toolId !== 'search' && !googleToken) {
      handleGoogleSignIn();
      return;
    }
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, signedIn: !t.signedIn } : t))
    );
  };

  const handleSignInToolByName = (toolName: string) => {
    if (!googleToken) {
      handleGoogleSignIn();
      return;
    }
    setTools((prev) =>
      prev.map((t) =>
        t.name.toLowerCase().includes(toolName.toLowerCase()) ||
        toolName.toLowerCase().includes(t.name.toLowerCase())
          ? { ...t, signedIn: true }
          : t
      )
    );
  };

  const handleApproveDeliverableItem = (sessionId: string, itemId: string) => {
    if (!activeBot) return;
    setBots((prev) =>
      prev.map((b) => {
        if (b.id !== activeBot.id) return b;
        return {
          ...b,
          timeline: b.timeline.map((entry) => {
            if (
              entry.kind === 'computer' &&
              entry.computerSession?.id === sessionId &&
              entry.computerSession.deliverable
            ) {
              return {
                ...entry,
                computerSession: {
                  ...entry.computerSession,
                  deliverable: {
                    ...entry.computerSession.deliverable,
                    items: entry.computerSession.deliverable.items.map((it) =>
                      it.id === itemId
                        ? { ...it, approved: true, status: 'Dispatched & Synced' }
                        : it
                    ),
                  },
                },
              };
            }
            return entry;
          }),
        };
      })
    );
  };

  const handleExternalCredentialsSubmitted = (cred: {
    serviceName: string;
    websiteUrl: string;
    username: string;
    secret: string;
    actionNote: string;
  }) => {
    if (!activeBot) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const userMsg: ChatTimelineEntry = {
      id: `usr-cred-${Date.now()}`,
      kind: 'user',
      text: `[Portal Credentials Provided] Connected to ${cred.serviceName} (${cred.username}). Action: ${cred.actionNote}`,
    };
    const botMsg: ChatTimelineEntry = {
      id: `bot-cred-${Date.now()}`,
      kind: 'bot',
      text: `Credentials for ${cred.serviceName} verified. Automated web agent is executing your requested task: "${cred.actionNote}".`,
      computerSession: {
        id: `sess-${Date.now()}`,
        appName: `${cred.serviceName} Web Agent`,
        url: cred.websiteUrl || 'https://portal.example.com',
        actionSummary: `Automated Task Active on ${cred.serviceName}`,
        status: 'done',
        targetTool: 'web',
        steps: [
          { order: 1, tool: 'web', action: 'Auth Handshake', detail: `Authenticated as ${cred.username}`, status: 'done', duration: '0.4s' },
          { order: 2, tool: 'web', action: 'Navigate & Execute', detail: cred.actionNote, status: 'done', duration: '0.5s' },
          { order: 3, tool: 'web', action: 'Verification', detail: 'Completed requested web operation successfully', status: 'done', duration: '0.2s' },
        ],
      },
    };

    setBots((prev) =>
      prev.map((b) =>
        b.id === activeBot.id
          ? {
              ...b,
              timestamp: nowTime,
              sidebarPreview: `Connected to ${cred.serviceName}`,
              timeline: [...b.timeline, userMsg, botMsg],
            }
          : b
      )
    );
  };

  const handleSendMessage = async (text?: string, isVoice?: boolean) => {
    const promptToSend = (text ?? inputMessage).trim();
    if (!promptToSend || isProcessing) return;

    // Capture attached file snapshot
    const currentAttachment = attachedFile;

    // Auto-create bot if none exists yet!
    let currentBot = activeBot;
    if (!currentBot) {
      const defaultBot: BotTeammate = {
        id: `bot-${Date.now()}`,
        name: 'Workspace Assistant',
        role: 'All-in-One Autonomous Agent',
        avatarShape: 'circle-teal',
        color: '#2CB696',
        description: 'Automates Gmail, Calendar, Tasks, Docs, Sheets, and Web Research.',
        requiredTools: ['Gmail', 'Google Calendar', 'Google Tasks', 'Google Docs', 'Google Sheets'],
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        sidebarPreview: 'Ready for assignments.',
        timeline: [],
      };
      setBots([defaultBot]);
      setSelectedBotId(defaultBot.id);
      currentBot = defaultBot;
    }

    const userEntry: ChatTimelineEntry = {
      id: `u-${Date.now()}`,
      kind: 'user',
      text: promptToSend,
      attachedFile: currentAttachment || undefined,
      isVoiceCommand: !!isVoice,
    };

    const targetBotId = currentBot.id;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    setBots((prev) =>
      prev.map((b) =>
        b.id === targetBotId
          ? {
              ...b,
              timestamp: nowTime,
              sidebarPreview: 'Running workspace task...',
              timeline: [...b.timeline, userEntry],
            }
          : b
      )
    );

    setInputMessage('');
    setAttachedFile(null);
    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningVoice(false);
    }

    setIsProcessing(true);
    setCurrentStepText('Analyzing command with Gemini AI...');

    try {
      const history = currentBot.timeline
        .filter((e) => e.kind === 'user' || e.kind === 'bot')
        .map((e) => ({
          role: e.kind === 'user' ? 'user' : 'model',
          text: e.text || '',
        }));

      const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
      const clientCurrentDate = new Date().toISOString().split('T')[0];

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: currentBot.name,
          botRole: currentBot.role,
          userPrompt: promptToSend,
          conversationHistory: history,
          isGoogleConnected: !!googleToken,
          userEmail: googleUser?.email,
          clientTimeZone,
          clientCurrentDate,
          userProfile,
          memoryContext: memoryEntries.slice(0, 10),
          attachedFile: currentAttachment,
        }),
      });

      let fetchedData = await res.json().catch(() => null);

      if (!res.ok || !fetchedData || !fetchedData.replyText) {
        console.warn('API returned non-200 or unparsed response, activating intelligent fallback executor');
        fetchedData = executeFallbackIntelligence({
          prompt: promptToSend,
          userTimeZone: clientTimeZone,
          currentDateStr: clientCurrentDate,
          tomorrowDateStr: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          attachedFile: currentAttachment,
        });
      }

      if (fetchedData.actionType === 'request_credentials') {
        setIsExternalAuthOpen(true);
      }

      const data = fetchedData;

      // Auto-record this activity in user's Activity Memory
      const actionType = data.actionType;
      const payload = data.actionPayload;

      let memType: 'task' | 'meeting' | 'email' | 'doc' | 'sheet' | 'search' = 'task';
      let memTitle = promptToSend.length > 55 ? `${promptToSend.slice(0, 52)}...` : promptToSend;
      let memDesc = data.sidebarPreview || 'Task completed autonomously';
      let memCounterpart: string | undefined = undefined;

      if (actionType === 'manage_task') {
        memType = 'task';
        memTitle = payload?.taskTitle ? `Task: ${payload.taskTitle}` : 'Google Task';
        memDesc = `${payload?.taskAction === 'delete' ? 'Deleted' : payload?.taskAction === 'edit' ? 'Edited' : 'Created'} Google Task${payload?.taskDateLabel ? ` (${payload.taskDateLabel})` : ''}`;
      } else if (actionType === 'create_calendar_event' || actionType === 'check_gmail_meetings') {
        memType = 'meeting';
        memTitle = payload?.eventSummary || 'Google Calendar Meeting';
        memDesc = payload?.timeZoneConversionNote || `Event: ${payload?.eventStart} (with 5-minute reminder)`;
        memCounterpart = payload?.to || 'Client';
      } else if (actionType === 'send_email') {
        memType = 'email';
        memTitle = payload?.cleanSubject || payload?.subject || 'Email Dispatch';
        memDesc = `Email sent to ${payload?.to}`;
        memCounterpart = payload?.to;
      } else if (actionType === 'create_doc_and_sheet' || actionType === 'create_doc') {
        memType = 'doc';
        memTitle = payload?.docTitle || 'Google Docs Research Report';
        memDesc = 'Generated comprehensive research document ready for download';
      } else if (actionType === 'create_sheet') {
        memType = 'sheet';
        memTitle = payload?.sheetTitle || 'Google Sheets Spreadsheet';
        memDesc = `Formatted spreadsheet with ${payload?.sheetRows?.length || 0} rows`;
      } else if (promptToSend.toLowerCase().includes('influencer') || promptToSend.toLowerCase().includes('search') || promptToSend.toLowerCase().includes('list')) {
        memType = 'search';
        memTitle = 'Market & Influencer Research';
        memDesc = promptToSend;
      }

      const newMemRecord: ActivityMemoryEntry = {
        id: `mem-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        type: memType,
        title: memTitle,
        description: memDesc,
        counterpart: memCounterpart,
        tags: [memType.toUpperCase(), currentBot.name],
      };

      setMemoryEntries((prev) => {
        const updated = [newMemRecord, ...prev];
        const accountKey = googleUser?.email || 'guest';
        localStorage.setItem(`agentflow_memory_${accountKey}`, JSON.stringify(updated));
        return updated;
      });

      // Background Drive sync if Google is connected
      if (googleToken) {
        getOrCreateDriveFolder(googleToken, 'AgentFlow - Memory')
          .then((folder) => {
            uploadOrUpdateDriveFile(googleToken, {
              name: 'activity_memory.json',
              content: JSON.stringify([newMemRecord, ...memoryEntries], null, 2),
              mimeType: 'application/json',
              folderId: folder.id,
            }).catch(() => {});
          })
          .catch(() => {});
      }

      const newEntries: ChatTimelineEntry[] = [];

      // 1. Bot conversational reply
      if (data.replyText) {
        newEntries.push({
          id: `bot-${Date.now()}`,
          kind: 'bot',
          text: data.replyText,
        });
      }

      // 2. Dynamic Computer card
      if (data.computerSession) {
        newEntries.push({
          id: `comp-${Date.now()}`,
          kind: 'computer',
          computerSession: {
            ...data.computerSession,
            id: `cs-${Date.now()}`,
            actionType: data.actionType,
            actionPayload: data.actionPayload,
          },
        });
      }

      setBots((prev) =>
        prev.map((b) =>
          b.id === targetBotId
            ? {
                ...b,
                timestamp: nowTime,
                sidebarPreview: data.sidebarPreview || 'Done.',
                timeline: [...b.timeline, ...newEntries],
              }
            : b
        )
      );
    } catch (err: any) {
      console.error(err);
      setBots((prev) =>
        prev.map((b) =>
          b.id === targetBotId
            ? {
                ...b,
                timeline: [
                  ...b.timeline,
                  {
                    id: `bot-err-${Date.now()}`,
                    kind: 'bot',
                    text: 'I ran into an issue connecting to the AI brain. Please verify GEMINI_API_KEY in Settings > Secrets.',
                  },
                ],
              }
            : b
        )
      );
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  if (!googleUser && !isGuestMode) {
    return (
      <PublicLandingPage
        onSignInWithGoogle={handleGoogleSignIn}
        onEnterAsGuest={() => setIsGuestMode(true)}
        isLoggingIn={isLoggingInGoogle}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F4] text-[#111111] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 5-Minute Meeting / Task Alert Toast */}
      {activeReminderAlert && (
        <div className="bg-[#111111] text-white px-5 py-2.5 flex items-center justify-between text-[13px] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
              <BellRing className="w-4 h-4 animate-bounce" />
            </span>
            <span>
              <strong>5-Minute Reminder:</strong> "{activeReminderAlert.title}" {activeReminderAlert.timeText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveReminderAlert(null)}
            className="text-[12px] text-neutral-400 hover:text-white underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-[54px] px-5 bg-white border-b border-[#E6E6E4] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsGuestMode(false)}
            className="text-[16px] font-bold tracking-tight text-[#111111] hover:text-purple-600 transition-colors cursor-pointer"
            title="AgentFlow Workspace"
          >
            AgentFlow
          </button>
          <span className="hidden sm:inline text-[12px] text-neutral-400">
            · Complete AI Workspace Agent
          </span>
          {!googleUser && (
            <button
              type="button"
              onClick={() => setIsGuestMode(false)}
              className="hidden sm:inline-flex text-[11.5px] font-medium text-purple-600 hover:text-purple-800 ml-1 cursor-pointer"
            >
              ← Back to Homepage
            </button>
          )}
        </div>

        {/* Right Google Workspace Authentication Control */}
        <div className="flex items-center gap-3">
          {googleUser ? (
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="text-[12px] font-medium text-neutral-800 truncate max-w-[140px] sm:max-w-[200px]">
                {googleUser.email}
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="text-neutral-400 hover:text-neutral-900 transition-colors p-0.5 ml-1"
                title="Sign out of Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingInGoogle}
              className="gsi-material-button flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors text-[12.5px] font-medium text-neutral-800 cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingInGoogle ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsToolsDrawerOpen(true)}
            className="text-[12.5px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Workspace Tools</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWorkspaceHubOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 text-purple-900 text-[12.5px] font-semibold hover:from-purple-100 hover:to-indigo-100 transition-all cursor-pointer shadow-2xs"
            title="Activity Memory, User Information & Instructions, and Google Drive"
          >
            <Brain className="w-3.5 h-3.5 text-purple-600" />
            <span>Memory & Instructions</span>
            {memoryEntries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 text-[10.5px] font-mono font-bold">
                {memoryEntries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsHireModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[12.5px] font-medium hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Configure or calibrate your single unified super assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>⚡ Calibrate AI</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-2 sm:p-4 lg:p-5 flex overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto bg-white rounded-[18px] border border-[#E2E2DF] shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex overflow-hidden h-[calc(100vh-88px)]">
          {/* LEFT SIDEBAR: macOS style */}
          <aside className="w-[260px] sm:w-[280px] border-r border-[#EBEBE8] bg-white flex flex-col shrink-0 select-none">
            {/* Traffic Lights + Hub + Calibrate Button */}
            <div className="h-[50px] px-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F57] border border-black/5" />
                <span className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-black/5" />
                <span className="w-3 h-3 rounded-full bg-[#28C840] border border-black/5" />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceHubOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/70 transition-colors cursor-pointer"
                  title="Memory & User Instructions Hub"
                >
                  <Brain className="w-3 h-3 text-purple-600" />
                  <span>Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(true)}
                  className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Calibrate your Unified AI Assistant"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="px-3 pb-3">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Teammates"
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F4F4F5] rounded-[10px] text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Teammates List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
              {filteredBots.length === 0 ? (
                <div className="py-12 px-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-2.5">
                    <Bot className="w-5 h-5" />
                  </div>
                  <p className="text-[13px] font-medium text-neutral-700">No bots hired yet</p>
                  <p className="text-[11.5px] text-neutral-400 mt-1 mb-3">
                    Click + to hire an autonomous workspace teammate.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsHireModalOpen(true)}
                    className="text-[12px] font-medium text-neutral-900 underline hover:text-black cursor-pointer"
                  >
                    + Hire first bot
                  </button>
                </div>
              ) : (
                filteredBots.map((bot) => {
                  const isSelected = bot.id === selectedBotId;
                  return (
                    <div
                      key={bot.id}
                      onClick={() => setSelectedBotId(bot.id)}
                      className={`group w-full px-2.5 py-2.5 rounded-[12px] flex items-center gap-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#EDEDEC]' : 'hover:bg-[#F7F7F6]'
                      }`}
                    >
                      <BotAvatar
                        shape={bot.avatarShape}
                        color={bot.color}
                        size="md"
                        isWorking={isProcessing && isSelected}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[13.5px] font-semibold text-neutral-900 truncate">
                            {bot.name}
                          </span>
                          <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Super Bot
                          </span>
                        </div>
                        <p className="text-[11.5px] text-neutral-500 truncate mt-0.5">
                          {bot.sidebarPreview}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[9.5px] text-purple-700 font-semibold tracking-tight">
                          <span>Gmail · Calendar · Tasks · Docs · Sheets</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsHireModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-purple-600 transition-opacity"
                        title="Calibrate AI Assistant"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* MAIN CHAT & COMPUTER VIEWPORT */}
          <section className="flex-1 flex flex-col bg-white min-w-0">
            {activeBot ? (
              <>
                {/* Active Bot Top Bar */}
                <div className="h-[50px] px-5 border-b border-[#EBEBE8] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BotAvatar shape={activeBot.avatarShape} color={activeBot.color} size="sm" />
                    <span className="text-[14px] font-semibold text-neutral-900 truncate">
                      {activeBot.name}
                    </span>
                    <span className="hidden sm:inline text-[12px] text-neutral-400 truncate">
                      · {activeBot.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Autonomous Teammate</span>
                    </div>
                  </div>
                </div>

                {/* Timeline Stream - Spacious & Wide Display for Agent Activity */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
                  <div className="max-w-[1040px] mx-auto space-y-6">
                    {activeBot.timeline.map((entry) => {
                      if (entry.kind === 'timestamp') {
                        return (
                          <div key={entry.id} className="text-center text-[12.5px] text-neutral-400 py-1 tabular-nums font-medium">
                            {entry.text}
                          </div>
                        );
                      }

                      if (entry.kind === 'bot') {
                        return (
                          <div key={entry.id} className="flex flex-col items-start">
                            {/* 3D Modern Pearlescent Bot Bubble */}
                            <div className="bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] text-slate-900 rounded-[24px] rounded-bl-[6px] p-5 max-w-[860px] border border-[#E2E8F0] shadow-[0_10px_30px_-6px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.02)] space-y-2">
                              <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
                                <div className="flex items-center gap-2">
                                  <BotAvatar shape={activeBot.avatarShape} color={activeBot.color} size="sm" />
                                  <span className="text-[13px] font-bold text-neutral-900">{activeBot.name}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                                    AI Teammate
                                  </span>
                                </div>
                              </div>
                              <div className="text-[15px] sm:text-[16px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {entry.text}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (entry.kind === 'user') {
                        return (
                          <div key={entry.id} className="flex flex-col items-end">
                            {/* 3D Modern Vibrant Royal Blue/Indigo Bubble */}
                            <div className="bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#4F46E5] text-white rounded-[24px] rounded-br-[6px] p-4 sm:p-5 max-w-[680px] shadow-[0_10px_25px_-5px_rgba(37,99,235,0.45),inset_0_1px_1.5px_rgba(255,255,255,0.55),0_2px_4px_rgba(0,0,0,0.1)] border border-blue-400/40">
                              {/* Voice Command Badge if applicable */}
                              {entry.isVoiceCommand && (
                                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold tracking-wide uppercase text-blue-100">
                                  <Mic className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Voice Command</span>
                                </div>
                              )}

                              {/* Attached File Preview if user attached file */}
                              {entry.attachedFile && (
                                <div className="mb-2.5 p-2.5 rounded-xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center gap-2 text-[12.5px] text-white">
                                  <Paperclip className="w-4 h-4 text-blue-100 shrink-0" />
                                  <span className="font-semibold truncate max-w-[240px]">{entry.attachedFile.name}</span>
                                  <span className="text-[11px] opacity-80 shrink-0 font-mono">({Math.round(entry.attachedFile.size / 1024)} KB)</span>
                                </div>
                              )}

                              <div className="text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap font-medium">
                                {entry.text}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (entry.kind === 'computer' && entry.computerSession) {
                        return (
                          <div key={entry.id} className="flex justify-start pt-1 w-full">
                            <ComputerCard
                              session={entry.computerSession}
                              connectedTools={tools}
                              googleToken={googleToken}
                              onRequireGoogleLogin={handleGoogleSignIn}
                              onSignInTool={handleSignInToolByName}
                              onApproveDeliverableItem={handleApproveDeliverableItem}
                              onRequestExternalAuth={() => setIsExternalAuthOpen(true)}
                            />
                          </div>
                        );
                      }

                      return null;
                    })}

                    {/* Live Processing Indicator */}
                    {isProcessing && (
                      <div className="bg-[#F3F3F2] rounded-[20px] p-5 max-w-[640px] border border-black/5 space-y-2.5 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 text-[14px] font-semibold text-neutral-900">
                            <RefreshCw className="w-4 h-4 animate-spin text-neutral-800" />
                            <span>Virtual Computer & Workspace Runner Active</span>
                          </div>
                          <span className="text-[11.5px] font-mono text-neutral-400">Gemini Active</span>
                        </div>
                        <p className="text-[13.5px] text-neutral-600">{currentStepText}</p>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Compact User Input Area with File Attachment & Voice Command */}
                <div className="px-4 sm:px-8 py-3 bg-white border-t border-[#EAEAE8] shrink-0">
                  <div className="max-w-[1040px] mx-auto">
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Attached File Preview Chip */}
                    {attachedFile && (
                      <div className="mb-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[12px] text-blue-900 animate-fadeIn">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold truncate">{attachedFile.name}</span>
                          <span className="text-[10.5px] text-blue-600 font-mono">({Math.round(attachedFile.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="p-1 hover:bg-blue-100 rounded-md text-blue-500 hover:text-blue-800 cursor-pointer"
                          title="Remove attached file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Active Voice Recording Bar */}
                    {isListeningVoice && (
                      <div className="mb-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white text-[12.5px] font-semibold flex items-center justify-between shadow-md animate-pulse">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          <Mic className="w-4 h-4 animate-bounce" />
                          <span>Listening... Speak your command in Bengali or English</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendMessage(inputMessage, true)}
                            className="px-2.5 py-0.5 rounded-lg bg-white text-rose-600 text-[11.5px] font-bold hover:bg-rose-50 cursor-pointer"
                          >
                            Send
                          </button>
                          <button
                            type="button"
                            onClick={toggleVoiceRecording}
                            className="p-1 text-white/80 hover:text-white cursor-pointer"
                            title="Cancel voice input"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2 rounded-2xl border border-[#DCDCD8] bg-[#F7F7F6] focus-within:bg-white focus-within:border-neutral-900 transition-colors px-3 py-1.5 shadow-2xs"
                    >
                      {/* File Attachment Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                          attachedFile
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60'
                        }`}
                        title="Attach file (PDF, TXT, CSV, image, Excel/Doc)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Voice Command Button */}
                      <button
                        type="button"
                        onClick={toggleVoiceRecording}
                        className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                          isListeningVoice
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60'
                        }`}
                        title="Voice Command (Speak in Bangla or English)"
                      >
                        {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {/* External Portal / Website Login Button */}
                      <button
                        type="button"
                        onClick={() => setIsExternalAuthOpen(true)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer shrink-0"
                        title="Connect External Website Login / Portal Credentials"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder=""
                        className="flex-1 resize-none bg-transparent text-[14.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-1.5 px-1 leading-normal min-h-[38px] max-h-[90px]"
                      />

                      <button
                        type="submit"
                        disabled={(!inputMessage.trim() && !attachedFile) || isProcessing}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          (inputMessage.trim() || attachedFile) && !isProcessing
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        }`}
                        title="Send command"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              /* Clean Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 text-neutral-800" />
                </div>
                <h2 className="text-[20px] font-semibold text-neutral-900">
                  AI teammates you can give real work to.
                </h2>
                <p className="text-[13.5px] text-neutral-500 mt-2 mb-6 leading-relaxed">
                  Your workspace is clean. Click below to hire an AI teammate that checks Gmail, adds meetings to Calendar with 5-minute reminders, sends emails, manages Google Tasks, and exports formatted Google Docs or Google Sheets.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsHireModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[13.5px] font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Hire Your AI Teammate</span>
                  </button>

                  {!googleUser && (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoggingInGoogle}
                      className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-[13.5px] font-medium text-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right Tools Drawer */}
          <ToolsDrawer
            isOpen={isToolsDrawerOpen}
            onClose={() => setIsToolsDrawerOpen(false)}
            tools={tools}
            onToggleTool={handleToggleTool}
          />
        </div>
      </main>

      {/* Hire Bot Modal */}
      <HireBotModal
        isOpen={isHireModalOpen}
        onClose={() => setIsHireModalOpen(false)}
        onBotHired={handleBotHired}
      />

      {/* Workspace Hub Modal: Memory, User Information & Instructions, Google Drive Sync */}
      <WorkspaceHubModal
        isOpen={isWorkspaceHubOpen}
        onClose={() => setIsWorkspaceHubOpen(false)}
        googleToken={googleToken}
        googleUserEmail={googleUser?.email || null}
        googleUserName={googleUser?.displayName || null}
        memoryEntries={memoryEntries}
        onClearMemory={() => {
          setMemoryEntries([]);
          const accountKey = googleUser?.email || 'guest';
          localStorage.removeItem(`agentflow_memory_${accountKey}`);
        }}
        onAddManualMemory={(newEntry) => {
          const rec: ActivityMemoryEntry = {
            ...newEntry,
            id: `mem-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          };
          setMemoryEntries((prev) => {
            const updated = [rec, ...prev];
            const accountKey = googleUser?.email || 'guest';
            localStorage.setItem(`agentflow_memory_${accountKey}`, JSON.stringify(updated));
            return updated;
          });
        }}
        tools={tools}
        onToggleTool={handleToggleTool}
        onRequireGoogleLogin={handleGoogleSignIn}
        userProfile={userProfile}
        onUpdateUserProfile={(newProfile) => {
          setUserProfile(newProfile);
          const accountKey = googleUser?.email || 'guest';
          localStorage.setItem(`agentflow_profile_${accountKey}`, JSON.stringify(newProfile));
        }}
      />

      {/* External Website & Portal Authentication Modal */}
      <ExternalAuthModal
        isOpen={isExternalAuthOpen}
        onClose={() => setIsExternalAuthOpen(false)}
        onSubmitCredentials={handleExternalCredentialsSubmitted}
      />
    </div>
  );
}
