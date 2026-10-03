export type AvatarShape =
  | 'circle-orange'
  | 'circle-teal'
  | 'triangle-blue'
  | 'diamond-purple'
  | 'circle-blue'
  | 'circle-red'
  | 'crew-multi'
  | 'custom-hex'
  | 'violet-gem'
  | 'sunset-coral'
  | 'cyan-orb'
  | 'emerald-badge'
  | 'amber-star'
  | 'neon-magenta';

export interface ActivityMemoryEntry {
  id: string;
  timestamp: string;
  date: string;
  type: 'task' | 'meeting' | 'email' | 'doc' | 'sheet' | 'search';
  title: string;
  description: string;
  counterpart?: string;
  driveFileId?: string;
  driveUrl?: string;
  tags?: string[];
}

export interface UserInstructionProfile {
  userEmail: string;
  displayName: string;
  role: string;
  company: string;
  timeZone: string;
  customInstructions: string;
  preferredLanguage: string;
  defaultMeetingDuration: number;
  lastSyncedToDrive?: string;
  driveFileId?: string;
  driveFolderId?: string;
  driveUrl?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  url: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: string;
  signedIn: boolean;
  account: string;
  description: string;
  icon: string;
}

export interface ComputerStep {
  order: number;
  tool: string;
  action: string;
  detail: string;
  duration?: string;
  status: 'done' | 'active' | 'pending';
}

export interface DeliverableItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  channel?: string;
  status?: string;
  approved?: boolean;
}

export interface DeliverableData {
  title: string;
  type: 'code' | 'emails' | 'spreadsheet' | 'report' | 'actions' | 'custom';
  summary: string;
  items: DeliverableItem[];
}

export interface AttachedFileInfo {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  textContent?: string;
  base64?: string;
}

export interface ImportantEmailItem {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  senderEmail: string;
  senderName: string;
  date: string;
  snippet: string;
  isMeeting: boolean;
  meetingDateStr?: string;
  meetingTimeStr?: string;
  meetingStartIso?: string;
  meetingEndIso?: string;
  meetingHumanLabel?: string;
  draftReplySubject?: string;
  draftReplyBody?: string;
  status?: 'pending' | 'booked' | 'replied' | 'completed';
}

export interface ActionPayload {
  to?: string;
  subject?: string;
  cleanSubject?: string;
  body?: string;
  attachment?: {
    name: string;
    type: string;
    dataUrl?: string;
    base64?: string;
  };
  eventSummary?: string;
  eventStart?: string;
  eventEnd?: string;
  eventStartLabel?: string;
  clientTimeZone?: string;
  userTimeZone?: string;
  timeZoneConversionNote?: string;
  reminderMinutes?: number;
  taskAction?: 'add' | 'edit' | 'delete' | 'complete' | 'list';
  taskId?: string;
  taskTitle?: string;
  taskNotes?: string;
  taskDue?: string; // RFC 3339 formatted with date and time
  taskDateLabel?: string; // e.g. "Today at 10:00 PM"
  tasksList?: Array<{ id: string; title: string; due?: string; status?: string; notes?: string }>;
  docTitle?: string;
  docContent?: string;
  sheetTitle?: string;
  sheetHeaders?: string[];
  sheetRows?: (string | number)[][];
  targetDocName?: string;
  textToAdd?: string;
  textToDelete?: string;
  scannedEmails?: Array<any>;
  importantEmails?: ImportantEmailItem[];
  normalEmailsCount?: number;
}

export interface WorkspaceArtifact {
  type: 'doc' | 'sheet' | 'calendar' | 'email' | 'task';
  title: string;
  url?: string;
  downloadFilename?: string;
  downloadContent?: string;
  downloadMimeType?: string;
  statusText?: string;
}

export interface ComputerSessionData {
  id: string;
  appName: string;
  url: string;
  actionSummary: string;
  status: 'running' | 'needs_signin' | 'needs_permission' | 'done';
  targetTool?: string;
  actionType?: string;
  actionPayload?: ActionPayload;
  artifact?: WorkspaceArtifact;
  screenView?: {
    type: 'browser' | 'spreadsheet' | 'code' | 'email' | 'terminal' | 'dashboard';
    title: string;
    details: string;
    metrics?: Array<{ label: string; value: string }>;
    rawOutput?: string;
    tableRows?: Array<Record<string, string>>;
  };
  steps: ComputerStep[];
  deliverable?: DeliverableData;
}

export interface ChatTimelineEntry {
  id: string;
  kind: 'timestamp' | 'system' | 'user' | 'bot' | 'computer';
  text?: string;
  attachedFile?: AttachedFileInfo;
  isVoiceCommand?: boolean;
  computerSession?: ComputerSessionData;
}

export interface BotTeammate {
  id: string;
  name: string;
  role: string;
  avatarShape: AvatarShape;
  color: string;
  description: string;
  requiredTools: string[];
  systemPrompt?: string;
  timestamp: string;
  sidebarPreview: string;
  timeline: ChatTimelineEntry[];
}
