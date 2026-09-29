import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderSync,
  HardDrive,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sliders,
  Trash2,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { ActivityMemoryEntry, ToolDefinition, UserInstructionProfile } from '../types/bot';
import {
  getOrCreateDriveFolder,
  uploadOrUpdateDriveFile,
} from '../services/workspaceService';

interface WorkspaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleToken: string | null;
  googleUserEmail: string | null;
  googleUserName?: string | null;
  memoryEntries: ActivityMemoryEntry[];
  onClearMemory: () => void;
  onAddManualMemory: (entry: Omit<ActivityMemoryEntry, 'id' | 'timestamp'>) => void;
  tools: ToolDefinition[];
  onToggleTool: (toolId: string) => void;
  onRequireGoogleLogin: () => void;
  userProfile: UserInstructionProfile;
  onUpdateUserProfile: (profile: UserInstructionProfile) => void;
}

export const WorkspaceHubModal: React.FC<WorkspaceHubModalProps> = ({
  isOpen,
  onClose,
  googleToken,
  googleUserEmail,
  googleUserName,
  memoryEntries,
  onClearMemory,
  onAddManualMemory,
  tools,
  onToggleTool,
  onRequireGoogleLogin,
  userProfile,
  onUpdateUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'instructions' | 'drive' | 'tools'>('memory');
  const [profileForm, setProfileForm] = useState<UserInstructionProfile>(userProfile);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [memoryDriveUrl, setMemoryDriveUrl] = useState<string | null>(null);
  const [instructionsDriveUrl, setInstructionsDriveUrl] = useState<string | null>(null);
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    setProfileForm(userProfile);
  }, [userProfile]);

  if (!isOpen) return null;

  // Compute Frequent Counterparts & Stats from Memory
  const counterpartCounts: Record<string, number> = {};
  memoryEntries.forEach((m) => {
    if (m.counterpart) {
      counterpartCounts[m.counterpart] = (counterpartCounts[m.counterpart] || 0) + 1;
    }
  });

  const sortedCounterparts = Object.entries(counterpartCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const meetingCount = memoryEntries.filter((m) => m.type === 'meeting').length;
  const taskCount = memoryEntries.filter((m) => m.type === 'task').length;
  const docCount = memoryEntries.filter((m) => m.type === 'doc' || m.type === 'sheet').length;
  const emailCount = memoryEntries.filter((m) => m.type === 'email').length;

  // Sync Memory to Google Drive
  const handleSyncMemoryToDrive = async () => {
    if (!googleToken) {
      onRequireGoogleLogin();
      return;
    }

    setIsSyncingDrive(true);
    setSyncStatusText('Creating "AgentFlow - Memory" folder in your Google Drive...');
    try {
      const folder = await getOrCreateDriveFolder(googleToken, 'AgentFlow - Memory');
      setSyncStatusText('Uploading activity memory to Google Drive...');

      const memoryDataString = JSON.stringify(
        {
          appName: 'AgentFlow Grok Bot Memory',
          userEmail: googleUserEmail,
          lastUpdated: new Date().toISOString(),
          stats: {
            totalActivities: memoryEntries.length,
            meetings: meetingCount,
            tasks: taskCount,
            docsAndSheets: docCount,
            emails: emailCount,
          },
          frequentCounterparts: sortedCounterparts,
          memoryActivities: memoryEntries,
        },
        null,
        2
      );

      const file = await uploadOrUpdateDriveFile(googleToken, {
        name: 'activity_memory.json',
        content: memoryDataString,
        mimeType: 'application/json',
        folderId: folder.id,
      });

      setMemoryDriveUrl(file.url);
      setSyncStatusText(`✓ Memory successfully synced to Google Drive folder "AgentFlow - Memory"!`);
    } catch (err: any) {
      setSyncStatusText(`Error syncing to Drive: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Save User Instructions and Sync to Google Drive
  const handleSaveAndSyncInstructions = async () => {
    onUpdateUserProfile(profileForm);

    if (!googleToken) {
      setSyncStatusText('Profile saved locally. Sign in with Google to sync to your Drive.');
      return;
    }

    setIsSyncingDrive(true);
    setSyncStatusText('Syncing user profile & instructions to Google Drive...');
    try {
      const folder = await getOrCreateDriveFolder(googleToken, 'AgentFlow - User Instructions');

      const instructionsDataString = JSON.stringify(
        {
          appName: 'AgentFlow User Instructions & Profile',
          userEmail: googleUserEmail,
          lastUpdated: new Date().toISOString(),
          profile: profileForm,
        },
        null,
        2
      );

      const file = await uploadOrUpdateDriveFile(googleToken, {
        name: 'user_instructions.json',
        content: instructionsDataString,
        mimeType: 'application/json',
        folderId: folder.id,
      });

      setInstructionsDriveUrl(file.url);
      setSyncStatusText(`✓ Instructions saved & uploaded to Google Drive in "AgentFlow - User Instructions"!`);
      onUpdateUserProfile({
        ...profileForm,
        lastSyncedToDrive: new Date().toLocaleString(),
        driveUrl: file.url,
      });
    } catch (err: any) {
      setSyncStatusText(`Error syncing instructions: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleAddManualNoteSubmit = () => {
    if (!newMemoryNote.trim()) return;
    onAddManualMemory({
      date: new Date().toISOString().split('T')[0],
      type: 'task',
      title: 'Manual Memory Note',
      description: newMemoryNote.trim(),
      tags: ['Manual Note', 'User Habit'],
    });
    setNewMemoryNote('');
    setIsAddingNote(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-[24px] border border-neutral-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Top Header */}
        <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-[#FBFBFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold text-neutral-900">Workspace Hub & Brain</h3>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Autonomous Memory
                </span>
              </div>
              <p className="text-[12.5px] text-neutral-500">
                Persistent Memory, User Custom Instructions, and Google Drive Cloud Sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-200/70 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-200/80 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`py-3 px-3.5 text-[13.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'memory'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Memory & Past Tasks</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono">
              {memoryEntries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-3.5 text-[13.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'instructions'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>User Profile & Instructions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`py-3 px-3.5 text-[13.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'drive'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Drive Storage & Folders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-3.5 text-[13.5px] font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'tools'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Connected Tools</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAFAFA]">
          {/* Status Toast inside Modal */}
          {syncStatusText && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-[12.5px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncStatusText}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncStatusText(null)}
                className="text-xs text-blue-500 hover:text-blue-800 underline ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: MEMORY & ACTIVITY TRACKER */}
          {activeTab === 'memory' && (
            <div className="space-y-5">
              {/* Memory Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Total Tasks</span>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-neutral-900 mt-1">{taskCount}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Google Tasks managed</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Meetings Set</span>
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="text-xl font-bold text-neutral-900 mt-1">{meetingCount}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">With 5m reminders</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Docs & Sheets</span>
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold text-neutral-900 mt-1">{docCount}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Generated dossiers</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Emails Dispatched</span>
                    <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl font-bold text-neutral-900 mt-1">{emailCount}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Clean RFC 2047 subjects</div>
                </div>
              </div>

              {/* Drive Sync Action Bar */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FolderSync className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-neutral-900">
                      Auto-Sync Memory to Google Drive
                    </div>
                    <div className="text-[12px] text-neutral-500">
                      Dedicated folder: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">AgentFlow - Memory</code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {memoryDriveUrl && (
                    <a
                      href={memoryDriveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl border border-neutral-300 text-[12.5px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Drive</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleSyncMemoryToDrive}
                    disabled={isSyncingDrive}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isSyncingDrive ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing to Drive...</span>
                      </>
                    ) : (
                      <>
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Sync Memory to Drive Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Frequent Counterparts / Collaborator Patterns */}
              {sortedCounterparts.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-neutral-900">
                    <Users className="w-4 h-4 text-neutral-600" />
                    <span>Frequent Contacts & Meeting Collaborators (AI Pattern Memory)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortedCounterparts.map(([person, count], i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-[12px] flex items-center justify-between"
                      >
                        <span className="font-semibold text-neutral-800 truncate">{person}</span>
                        <span className="text-[11px] font-mono text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200 shrink-0">
                          {count} activities
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memory Activity Timeline Stream */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13.5px] font-bold text-neutral-900">
                    Recorded Memory Log (Auto-Sent to AI on Every Query)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote((v) => !v)}
                      className="text-[12px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      + Add Note
                    </button>
                    {memoryEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearMemory}
                        className="text-[12px] text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Clear Memory
                      </button>
                    )}
                  </div>
                </div>

                {isAddingNote && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 space-y-2">
                    <input
                      type="text"
                      value={newMemoryNote}
                      onChange={(e) => setNewMemoryNote(e.target.value)}
                      placeholder="e.g. 'Prefers Friday trading reviews at 4 PM' or 'Always CC johirul@example.com'..."
                      className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingNote(false)}
                        className="text-xs px-2.5 py-1 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualNoteSubmit}
                        className="text-xs px-3 py-1 bg-neutral-900 text-white rounded-lg cursor-pointer"
                      >
                        Save Note to Memory
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[300px] overflow-y-auto divide-y divide-neutral-100">
                  {memoryEntries.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs">
                      No activities recorded yet. When you command your bot to manage tasks, schedule meetings, or create documents, they will automatically be recorded here and synced to Google Drive!
                    </div>
                  ) : (
                    memoryEntries.map((item) => (
                      <div key={item.id} className="pt-2 first:pt-0 pb-1.5 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-neutral-900">{item.title}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600">
                              {item.type}
                            </span>
                            {item.counterpart && (
                              <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 rounded">
                                with {item.counterpart}
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-500 text-[11.5px] truncate">{item.description}</p>
                        </div>
                        <span className="text-[11px] text-neutral-400 font-mono shrink-0 tabular-nums">
                          {item.date}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER PROFILE & CUSTOM INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <div>
                    <h4 className="text-[14.5px] font-bold text-neutral-900">
                      Personalized AI Operating Profile
                    </h4>
                    <p className="text-[12px] text-neutral-500">
                      Saved exclusively for Google Account: <span className="font-semibold text-neutral-800">{googleUserEmail || 'Guest (Sign in with Google to isolate)'}</span>
                    </p>
                  </div>

                  {userProfile.lastSyncedToDrive && (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Synced to Drive: {userProfile.lastSyncedToDrive}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                      Your Name / Display Identity
                    </label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      placeholder="e.g. Johirul Islam"
                      className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F9F9F8] border border-neutral-200 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                      Professional Role / Specialization
                    </label>
                    <input
                      type="text"
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                      placeholder="e.g. Lead Trader & Executive Director"
                      className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F9F9F8] border border-neutral-200 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      placeholder="e.g. Bangladesh Trading Hub"
                      className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F9F9F8] border border-neutral-200 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                      Primary Timezone
                    </label>
                    <input
                      type="text"
                      value={profileForm.timeZone}
                      onChange={(e) => setProfileForm({ ...profileForm, timeZone: e.target.value })}
                      placeholder="Asia/Dhaka (UTC+6)"
                      className="w-full text-[13px] px-3 py-2 rounded-xl bg-[#F9F9F8] border border-neutral-200 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-neutral-700 mb-1">
                    Custom Instructions for Your AI Teammate (Rules, Behavior, Language & Formatting)
                  </label>
                  <textarea
                    rows={4}
                    value={profileForm.customInstructions}
                    onChange={(e) => setProfileForm({ ...profileForm, customInstructions: e.target.value })}
                    placeholder="Describe how your bot should think and respond. E.g.: 'Always use natural, polite Bengali for status summaries. For emails, keep the subject crisp with zero strange symbols. Default all meetings to 30 minutes with a 5-minute pre-reminder. For market lists, always provide verified follower numbers and platform links.'"
                    className="w-full text-[13px] p-3 rounded-xl bg-[#F9F9F8] border border-neutral-200 focus:outline-none focus:bg-white focus:border-neutral-900 transition-colors leading-relaxed"
                  />
                  <p className="text-[11.5px] text-neutral-400 mt-1">
                    These instructions are permanently appended to the AI reasoning engine and saved in your personal Google Drive folder: <code className="bg-neutral-100 px-1 py-0.5 rounded">AgentFlow - User Instructions</code>.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-2">
                    {instructionsDriveUrl && (
                      <a
                        href={instructionsDriveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Instructions File in Google Drive</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAndSyncInstructions}
                    disabled={isSyncingDrive}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[13px] font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSyncingDrive ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving & Syncing to Drive...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Sync to Google Drive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRIVE STORAGE & FOLDERS */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-bold text-neutral-900">
                      Google Drive Cloud Architecture
                    </h4>
                    <p className="text-[12px] text-neutral-500">
                      Your memory logs and instructions are stored directly inside your own Google Drive.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-neutral-900 flex items-center gap-1.5">
                        <FolderSync className="w-4 h-4 text-emerald-600" />
                        <span>AgentFlow - Memory</span>
                      </span>
                      <span className="text-[10.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        Live Folder
                      </span>
                    </div>
                    <p className="text-[12px] text-neutral-600">
                      Contains: <code className="bg-white px-1 py-0.5 rounded border border-neutral-200">activity_memory.json</code>
                      <br />Records all past tasks, meeting schedules, frequent partners, and preferences.
                    </p>
                    <button
                      type="button"
                      onClick={handleSyncMemoryToDrive}
                      className="text-[12px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <span>Sync Latest Memory</span> →
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-neutral-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>AgentFlow - User Instructions</span>
                      </span>
                      <span className="text-[10.5px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                        Personalized
                      </span>
                    </div>
                    <p className="text-[12px] text-neutral-600">
                      Contains: <code className="bg-white px-1 py-0.5 rounded border border-neutral-200">user_instructions.json</code>
                      <br />Strictly bound to your Google account ID so individual instructions remain private.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveAndSyncInstructions}
                      className="text-[12px] font-semibold text-purple-700 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <span>Save & Sync Instructions</span> →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTED TOOLS */}
          {activeTab === 'tools' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-3">
                <div className="text-[14px] font-bold text-neutral-900">
                  Google Workspace Tool Permissions & Connections
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/70 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-neutral-900">{tool.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tool.signedIn ? 'bg-emerald-500' : 'bg-amber-400'
                            }`}
                          />
                        </div>
                        <p className="text-[11.5px] text-neutral-500 truncate">{tool.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleTool(tool.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer shrink-0 ${
                          tool.signedIn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                      >
                        {tool.signedIn ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
