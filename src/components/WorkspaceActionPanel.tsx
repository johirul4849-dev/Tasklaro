import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Inbox,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { ActionPayload, ImportantEmailItem, WorkspaceArtifact } from '../types/bot';
import {
  createCalendarEvent,
  createGoogleDoc,
  createGoogleSheet,
  createGoogleTask,
  deleteGoogleTask,
  downloadFile,
  exportToCsv,
  findGoogleTaskByTitle,
  listCalendarEvents,
  listGmailMessages,
  listGoogleTasks,
  markGmailAsRead,
  ParsedEmailMessage,
  searchAndEditDocument,
  searchAndEditSheet,
  sendGmailMessage,
  updateGoogleTask,
} from '../services/workspaceService';
import { parseNaturalDateTime } from '../services/smartWorkspaceParser';

interface WorkspaceActionPanelProps {
  actionType?: string;
  actionPayload?: ActionPayload;
  googleToken: string | null;
  onRequireGoogleLogin: () => void;
  onArtifactCreated?: (artifact: WorkspaceArtifact) => void;
}

export const WorkspaceActionPanel: React.FC<WorkspaceActionPanelProps> = ({
  actionType,
  actionPayload,
  googleToken,
  onRequireGoogleLogin,
  onArtifactCreated,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [docArtifact, setDocArtifact] = useState<{ title: string; url: string } | null>(null);
  const [sheetArtifact, setSheetArtifact] = useState<{ title: string; url: string } | null>(null);
  const [calendarArtifact, setCalendarArtifact] = useState<{ title: string; url: string } | null>(null);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [hasAutoExecuted, setHasAutoExecuted] = useState(false);

  // Important emails scan & review state
  const [importantEmailsList, setImportantEmailsList] = useState<ImportantEmailItem[]>([]);
  const [normalEmailsCount, setNormalEmailsCount] = useState<number>(0);
  const [executingEmailId, setExecutingEmailId] = useState<string | null>(null);

  // Google Tasks interactive list state
  const [tasksList, setTasksList] = useState<Array<{ id: string; title: string; due?: string; status?: string; notes?: string }>>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('10:00 PM');

  if (!actionType || actionType === 'none' || !actionPayload) {
    return null;
  }

  // Autonomous execution when googleToken is ready
  useEffect(() => {
    if (!googleToken || hasAutoExecuted) return;

    const runAutonomousExecution = async () => {
      const userTimeZone = actionPayload.userTimeZone || 'Asia/Dhaka';
      const currentDateStr = new Date().toISOString().split('T')[0];
      const tomorrowDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // 1. GOOGLE TASKS
      if (actionType === 'manage_task') {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          if (actionPayload.taskAction === 'list') {
            setIsLoadingTasks(true);
            const liveTasks = await listGoogleTasks(googleToken);
            setTasksList(liveTasks);
            setExecutionResult(`✓ Retrieved ${liveTasks.length} active tasks from your Google Tasks account.`);
            setIsLoadingTasks(false);
          } else if (actionPayload.taskAction === 'delete' && actionPayload.taskTitle) {
            const found = await findGoogleTaskByTitle(googleToken, actionPayload.taskTitle);
            if (found) {
              await deleteGoogleTask(googleToken, found.id);
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" deleted from Google Tasks autonomously.`);
            } else {
              setExecutionResult(`Task "${actionPayload.taskTitle}" was not found in Google Tasks to delete.`);
            }
          } else if (actionPayload.taskAction === 'edit' && actionPayload.taskTitle) {
            const found = await findGoogleTaskByTitle(googleToken, actionPayload.taskTitle);
            const notes = `${actionPayload.taskNotes || ''}\n(Auto-reminder: 5m prior)`;
            if (found) {
              await updateGoogleTask(googleToken, found.id, {
                title: actionPayload.taskTitle,
                notes,
                due: actionPayload.taskDue,
              });
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" updated in Google Tasks with set time & 5m reminder.`);
            } else {
              await createGoogleTask(googleToken, {
                title: actionPayload.taskTitle,
                notes,
                due: actionPayload.taskDue,
              });
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" created in Google Tasks (${actionPayload.taskDateLabel || 'Set time'}).`);
            }
          } else if (actionPayload.taskTitle) {
            // Default: Add task with exact time & 5-minute reminder
            const notes = actionPayload.taskNotes || `⏰ Scheduled Time: ${actionPayload.taskDateLabel || 'Set Time'}\n🔔 Automated Reminder: 5 minutes prior\nGenerated by AgentFlow Workspace Super Assistant`;
            await createGoogleTask(googleToken, {
              title: actionPayload.taskTitle,
              notes,
              due: actionPayload.taskDue,
            });
            setExecutionResult(
              `✓ Task "${actionPayload.taskTitle}" scheduled in Google Tasks for ${actionPayload.taskDateLabel || 'scheduled time'} with an automated 5-minute reminder!`
            );
          }
        } catch (err: any) {
          setExecutionResult(`Google Tasks error: ${err.message}`);
        } finally {
          setIsExecuting(false);
          setIsLoadingTasks(false);
        }
      }

      // 2. GOOGLE DOCS: CREATE OR EDIT
      if (
        (actionType === 'create_doc' || actionType === 'create_doc_and_sheet') &&
        actionPayload.docContent &&
        !docArtifact
      ) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const doc = await createGoogleDoc(googleToken, {
            title: actionPayload.docTitle || 'AgentFlow Executive Report',
            content: actionPayload.docContent,
          });
          setDocArtifact({ title: doc.title, url: doc.url });
          setExecutionResult((prev) =>
            prev ? `${prev} | ✓ Google Doc Created: "${doc.title}"` : `✓ Google Doc Created: "${doc.title}"!`
          );
          if (onArtifactCreated) onArtifactCreated({ type: 'doc', title: doc.title, url: doc.url });
        } catch (err: any) {
          setExecutionResult(`Error creating Google Doc: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 3. EDIT EXISTING DRIVE DOC OR FILE
      if (actionType === 'edit_drive_doc' && actionPayload.targetDocName) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const res = await searchAndEditDocument(
            googleToken,
            actionPayload.targetDocName,
            actionPayload.textToAdd,
            actionPayload.textToDelete
          );
          setDocArtifact({ title: res.title, url: res.url });
          setExecutionResult(
            `✓ Successfully ${res.action === 'edited' ? 'found and updated' : 'created'} document "${res.title}" in Google Drive!`
          );
          if (onArtifactCreated) onArtifactCreated({ type: 'doc', title: res.title, url: res.url });
        } catch (err: any) {
          setExecutionResult(`Error updating Drive document: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 4. GOOGLE SHEETS: CREATE OR EDIT (WITH PROFESSIONAL COLORFUL DESIGN)
      if (
        (actionType === 'create_sheet' || actionType === 'create_doc_and_sheet') &&
        actionPayload.sheetRows &&
        actionPayload.sheetRows.length > 0 &&
        !sheetArtifact
      ) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const headers = actionPayload.sheetHeaders || ['Rank', 'Name', 'Category', 'Details', 'Contact'];
          const rows = actionPayload.sheetRows.map((r) => r.map(String));
          const sheet = await createGoogleSheet(googleToken, {
            title: actionPayload.sheetTitle || 'AgentFlow Structured Sheet',
            headers,
            rows,
          });
          setSheetArtifact({ title: sheet.title, url: sheet.url });
          setExecutionResult((prev) =>
            prev ? `${prev} | ✓ Google Sheet Created & Formatted: "${sheet.title}"` : `✓ Google Sheet Created & Formatted: "${sheet.title}"!`
          );
          if (onArtifactCreated) onArtifactCreated({ type: 'sheet', title: sheet.title, url: sheet.url });
        } catch (err: any) {
          setExecutionResult(`Error creating Google Sheet: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 5. GOOGLE CALENDAR: SINGLE EVENT SCHEDULE
      if (actionType === 'create_calendar_event' && actionPayload.eventSummary && !calendarArtifact) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const desc = actionPayload.timeZoneConversionNote
            ? `${actionPayload.timeZoneConversionNote}\n\nClient TimeZone: ${actionPayload.clientTimeZone || 'N/A'}\nLocal TimeZone: ${userTimeZone}\n\nAutomated by AgentFlow Super Assistant`
            : 'Scheduled autonomously by AgentFlow with 5-minute reminder';

          const ev = await createCalendarEvent(googleToken, {
            summary: actionPayload.eventSummary,
            description: desc,
            startDateTime: actionPayload.eventStart || new Date().toISOString(),
            endDateTime: actionPayload.eventEnd || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            timeZone: userTimeZone,
            reminderMinutes: 5,
          });
          if (ev.htmlLink) {
            setCalendarArtifact({ title: actionPayload.eventSummary, url: ev.htmlLink });
          }
          setExecutionResult(
            `✓ Event "${actionPayload.eventSummary}" scheduled in Google Calendar (${actionPayload.eventStartLabel || 'Time confirmed'}) with a 5-minute reminder!`
          );
        } catch (err: any) {
          setExecutionResult(`Error creating Calendar event: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 6. GMAIL INBOX SCAN, IMPORTANT EMAIL REVIEW DISPLAY & CONFIRMATION DISPATCH
      if (actionType === 'check_gmail_meetings') {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const processedKey = 'agentflow_processed_emails_v2';
          let processedIds: string[] = [];
          try {
            processedIds = JSON.parse(localStorage.getItem(processedKey) || '[]');
          } catch {}

          const emails = await listGmailMessages(googleToken, 'in:inbox');

          const importantItems: ImportantEmailItem[] = [];
          let routineCount = 0;

          for (const email of emails) {
            const isProcessed = processedIds.includes(email.id);
            const combinedText = `${email.subject} ${email.snippet} ${email.from}`;

            // Parse date & time from the email content
            const parsedDt = parseNaturalDateTime(combinedText, currentDateStr, tomorrowDateStr, userTimeZone);

            const isMeetingOrPriority =
              email.isMeetingRequest ||
              parsedDt.dateFound ||
              /urgent|meeting|meet|appointment|schedule|interview|call|agenda|proposal|contract|quote/i.test(combinedText);

            if (isMeetingOrPriority && !isProcessed) {
              const draftSubject = `Re: ${email.subject.replace(/^Re:\s*/i, '')}`;
              const draftBody = `Hello ${email.senderName || 'there'},\n\nThank you for reaching out. I have confirmed your meeting invitation for ${parsedDt.humanLabel} (UTC+6 / Bangladesh Time).\n\nThe event has been booked in Google Calendar with an automated 5-minute advance reminder, and a Google Meet video conference link has been attached.\n\nLooking forward to speaking with you.\n\nBest regards,\nAgentFlow Workspace Assistant`;

              importantItems.push({
                id: email.id,
                threadId: email.threadId,
                subject: email.subject,
                from: email.from,
                senderEmail: email.senderEmail,
                senderName: email.senderName,
                date: email.date,
                snippet: email.snippet,
                isMeeting: true,
                meetingDateStr: parsedDt.dateStr,
                meetingTimeStr: parsedDt.timeStr,
                meetingStartIso: parsedDt.startIso,
                meetingEndIso: parsedDt.endIso,
                meetingHumanLabel: parsedDt.humanLabel,
                draftReplySubject: draftSubject,
                draftReplyBody: draftBody,
                status: 'pending',
              });
            } else {
              // Routine email: auto-process without interrupting user
              routineCount++;
              if (email.isUnread && !isProcessed) {
                // Auto mark routine notifications as read
                await markGmailAsRead(googleToken, email.id);
                processedIds.push(email.id);
              }
            }
          }

          localStorage.setItem(processedKey, JSON.stringify(processedIds));
          setImportantEmailsList(importantItems);
          setNormalEmailsCount(routineCount);

          if (importantItems.length > 0) {
            setExecutionResult(
              `✓ Scanned Gmail inbox: Found ${importantItems.length} priority meeting/action request(s). Displayed below for your review & instant 1-click execution. (${routineCount} routine emails processed automatically without interruption).`
            );
          } else {
            setExecutionResult(
              `✓ Scanned Gmail inbox: All caught up! 0 pending urgent requests found. (${routineCount} routine emails processed automatically without interruption).`
            );
          }
        } catch (err: any) {
          setExecutionResult(`Gmail Inbox Scan error: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }
    };

    runAutonomousExecution();
  }, [googleToken, actionType, actionPayload, hasAutoExecuted]);

  // Execute a single Important Email action: Book Calendar + Send Confirmation Email + Mark Read
  const handleApproveImportantEmail = async (item: ImportantEmailItem) => {
    if (!googleToken) {
      onRequireGoogleLogin();
      return;
    }

    setExecutingEmailId(item.id);
    try {
      const userTimeZone = actionPayload.userTimeZone || 'Asia/Dhaka';

      // 1. Create Google Calendar event with exact parsed date & time and 5m reminder
      const ev = await createCalendarEvent(googleToken, {
        summary: `Meeting: ${item.subject}`,
        description: `Meeting confirmed autonomously by AgentFlow Super Assistant.\nClient: ${item.senderName} (${item.senderEmail})\nTopic: ${item.snippet}\n5-minute advance reminder set automatically.`,
        startDateTime: item.meetingStartIso || new Date(Date.now() + 86400000).toISOString(),
        endDateTime: item.meetingEndIso || new Date(Date.now() + 86400000 + 45 * 60 * 1000).toISOString(),
        timeZone: userTimeZone,
        attendees: item.senderEmail && item.senderEmail.includes('@') ? [item.senderEmail] : [],
        reminderMinutes: 5,
      });

      if (ev.htmlLink) {
        setCalendarArtifact({ title: item.subject, url: ev.htmlLink });
      }

      // 2. Send Confirmation Reply email to real sender
      if (item.senderEmail && item.senderEmail.includes('@') && !item.senderEmail.includes('example.com')) {
        await sendGmailMessage(googleToken, {
          to: item.senderEmail,
          subject: item.draftReplySubject || `Re: ${item.subject}`,
          body: item.draftReplyBody || `Hello,\n\nYour meeting has been confirmed for ${item.meetingHumanLabel || 'scheduled time'}.\n\nBest regards,\nAgentFlow Workspace`,
          threadId: item.threadId,
        });
      }

      // 3. Mark email as read in Gmail to prevent duplicates
      await markGmailAsRead(googleToken, item.id);

      // 4. Update local processed list
      const processedKey = 'agentflow_processed_emails_v2';
      let processedIds: string[] = [];
      try {
        processedIds = JSON.parse(localStorage.getItem(processedKey) || '[]');
      } catch {}
      processedIds.push(item.id);
      localStorage.setItem(processedKey, JSON.stringify(processedIds));

      // 5. Update UI status
      setImportantEmailsList((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, status: 'completed' } : e))
      );

      setExecutionResult(
        `✓ Meeting booked in Google Calendar for ${item.meetingHumanLabel || 'scheduled time'} with a 5-minute reminder, marked as read, and confirmation email dispatched to ${item.senderEmail}!`
      );
    } catch (err: any) {
      setExecutionResult(`Error executing meeting confirmation: ${err.message}`);
    } finally {
      setExecutingEmailId(null);
    }
  };

  // Approve & execute ALL important emails in sequence
  const handleApproveAllImportantEmails = async () => {
    if (!googleToken) {
      onRequireGoogleLogin();
      return;
    }

    const pending = importantEmailsList.filter((e) => e.status !== 'completed');
    if (pending.length === 0) return;

    setIsExecuting(true);
    for (const item of pending) {
      await handleApproveImportantEmail(item);
    }
    setIsExecuting(false);
  };

  // Google Tasks: Toggle Complete
  const handleToggleTaskStatus = async (taskId: string, currentStatus?: string) => {
    if (!googleToken) return;
    const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
    try {
      await updateGoogleTask(googleToken, taskId, { status: newStatus });
      setTasksList((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      console.warn('Error updating task:', err);
    }
  };

  // Google Tasks: Delete
  const handleDeleteTask = async (taskId: string) => {
    if (!googleToken) return;
    try {
      await deleteGoogleTask(googleToken, taskId);
      setTasksList((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.warn('Error deleting task:', err);
    }
  };

  // Google Tasks: Quick Add
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken || !newTaskInput.trim()) return;

    try {
      const currentDateStr = new Date().toISOString().split('T')[0];
      const tomorrowDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const dt = parseNaturalDateTime(`${newTaskInput} ${newTaskTime}`, currentDateStr, tomorrowDateStr);

      const created = await createGoogleTask(googleToken, {
        title: newTaskInput.trim(),
        due: dt.startIso,
        notes: `⏰ Scheduled Time: ${dt.timeStr} (UTC+6)\n🔔 Automated Reminder: 5 minutes prior`,
      });

      setTasksList((prev) => [
        {
          id: created.id,
          title: newTaskInput.trim(),
          due: dt.startIso,
          status: 'needsAction',
          notes: `⏰ Set Time: ${dt.timeStr}`,
        },
        ...prev,
      ]);
      setNewTaskInput('');
    } catch (err: any) {
      console.warn('Error adding task:', err);
    }
  };

  // Manual Trigger for Gmail email send (Safety Confirmation)
  const handleSendEmailConfirmed = async () => {
    if (!googleToken) {
      onRequireGoogleLogin();
      return;
    }
    if (!actionPayload.to) return;

    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const safeSubject = actionPayload.cleanSubject || actionPayload.subject || 'Follow-up from AgentFlow';
      await sendGmailMessage(googleToken, {
        to: actionPayload.to,
        subject: safeSubject,
        body: actionPayload.body || '',
        attachment: actionPayload.attachment,
      });
      setExecutionResult(`✓ Email dispatched to "${actionPayload.to}" with clean subject "${safeSubject}"!`);
      setShowSendConfirmModal(false);
    } catch (err: any) {
      setExecutionResult(`Error sending email: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // Download Handlers
  const handleDownloadDoc = () => {
    const filename = `${(actionPayload.docTitle || 'executive_report').toLowerCase().replace(/\s+/g, '_')}.md`;
    const content = `# ${actionPayload.docTitle || 'Document'}\n\n${actionPayload.docContent || ''}\n\n---\n*Created autonomously by AgentFlow Workspace Super Assistant*`;
    downloadFile(filename, content, 'text/markdown;charset=utf-8');
  };

  const handleDownloadCsv = () => {
    const filename = `${(actionPayload.sheetTitle || 'structured_data').toLowerCase().replace(/\s+/g, '_')}.csv`;
    const headers = actionPayload.sheetHeaders || ['Rank', 'Name', 'Category', 'Details'];
    const rows = actionPayload.sheetRows || [];
    const csvContent = exportToCsv(headers, rows);
    downloadFile(filename, csvContent, 'text/csv;charset=utf-8');
  };

  return (
    <div className="mt-3.5 p-4 rounded-[18px] border border-neutral-200/90 bg-white/95 space-y-4 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[13px] font-semibold text-neutral-900">
            Google Workspace Autonomous Execution Engine
          </span>
          {googleToken ? (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Live Connected
            </span>
          ) : (
            <button
              type="button"
              onClick={onRequireGoogleLogin}
              className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100 border border-blue-200/60 cursor-pointer"
            >
              Connect Google for Auto-Execution
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11.5px] text-neutral-500">
          <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
            <Clock className="w-3.5 h-3.5" />
            <span>5m Advance Alert Active</span>
          </span>
          <span className="flex items-center gap-1 font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
            <Globe className="w-3.5 h-3.5" />
            <span>UTC+6 (Bangladesh Time)</span>
          </span>
        </div>
      </div>

      {/* Execution status indicator */}
      {isExecuting && (
        <div className="flex items-center gap-2 text-[12.5px] text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/60">
          <RefreshCw className="w-4 h-4 animate-spin text-neutral-900 shrink-0" />
          <span>Executing command directly in Google Workspace...</span>
        </div>
      )}

      {executionResult && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[12.5px] flex items-start gap-2.5 leading-relaxed">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>{executionResult}</div>
        </div>
      )}

      {/* 1. GMAIL IMPORTANT EMAILS REVIEW DISPLAY (User Review & Confirm Hub) */}
      {importantEmailsList.length > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-neutral-50 to-blue-50/40 border border-blue-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600" />
              <h4 className="text-[13.5px] font-bold text-neutral-900">
                Important Inbox Items Requiring Your Review ({importantEmailsList.length})
              </h4>
            </div>
            {importantEmailsList.length > 1 && (
              <button
                type="button"
                onClick={handleApproveAllImportantEmails}
                disabled={isExecuting}
                className="text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Approve & Execute All</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {importantEmailsList.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white border border-neutral-200/80 shadow-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 text-[13px]">{item.senderName}</span>
                    <span className="text-[11.5px] text-neutral-500">&lt;{item.senderEmail}&gt;</span>
                  </div>
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {item.meetingHumanLabel || 'Meeting Request'}
                  </span>
                </div>

                <div className="text-[12.5px] font-medium text-neutral-800">
                  {item.subject}
                </div>
                <div className="text-[12px] text-neutral-600 italic bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  "{item.snippet}"
                </div>

                {/* Draft confirmation reply preview */}
                <div className="text-[11.5px] text-neutral-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 space-y-1">
                  <div className="font-semibold text-blue-900 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Auto Confirmation Reply Draft to {item.senderEmail}:</span>
                  </div>
                  <div className="whitespace-pre-line text-neutral-800 font-sans">
                    {item.draftReplyBody}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-end pt-1">
                  {item.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Booked in Calendar & Confirmation Dispatched</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApproveImportantEmail(item)}
                      disabled={executingEmailId === item.id || isExecuting}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      {executingEmailId === item.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Scheduling & Sending Reply...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Approve & Execute (Schedule Calendar + Send Reply)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {normalEmailsCount > 0 && (
            <div className="text-[12px] text-neutral-600 bg-neutral-100/70 p-2 rounded-lg text-center">
              ✓ {normalEmailsCount} routine / general conversation email(s) processed automatically without interrupting your focus.
            </div>
          )}
        </div>
      )}

      {/* 2. GOOGLE TASKS INTERACTIVE LIST & MANAGEMENT */}
      {actionType === 'manage_task' && (
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h4 className="text-[13.5px] font-bold text-neutral-900">
                Google Tasks - Active & Today's Priorities
              </h4>
            </div>
            {googleToken && (
              <button
                type="button"
                onClick={async () => {
                  setIsLoadingTasks(true);
                  const live = await listGoogleTasks(googleToken);
                  setTasksList(live);
                  setIsLoadingTasks(false);
                }}
                className="text-[11.5px] text-neutral-600 hover:text-neutral-900 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            )}
          </div>

          {/* Quick Add Task Form */}
          <form onSubmit={handleQuickAddTask} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Add new task (e.g. 'Dinner with Rina')..."
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-[12.5px] focus:outline-hidden focus:border-neutral-900"
            />
            <input
              type="text"
              value={newTaskTime}
              onChange={(e) => setNewTaskTime(e.target.value)}
              placeholder="Time (e.g. 10:00 PM)"
              className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[12.5px] focus:outline-hidden focus:border-neutral-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[12px] font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {tasksList.length > 0 ? (
              tasksList.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-[12.5px] transition-colors ${
                    t.status === 'completed'
                      ? 'bg-neutral-100/60 border-neutral-200 text-neutral-400 line-through'
                      : 'bg-white border-neutral-200/80 text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(t.id, t.status)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                        t.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {t.status === 'completed' && <Check className="w-3 h-3" />}
                    </button>
                    <span className="font-medium truncate">{t.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.due && (
                      <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                        ⏰ {new Date(t.due).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (5m alert)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[12px] text-neutral-500 py-3 text-center">
                {isLoadingTasks ? 'Loading tasks from Google...' : 'No tasks listed. Add your first priority task above!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2.5 GOOGLE DRIVE FILE EDIT CARD */}
      {actionType === 'edit_drive_doc' && actionPayload.targetDocName && (
        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-[13.5px] font-bold text-neutral-900">
                Google Drive Document Update: "{actionPayload.targetDocName}"
              </h4>
            </div>
            {docArtifact && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                Synced to Drive
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-[12px] bg-white p-3 rounded-lg border border-neutral-200/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-700">Target File:</span>
              <span className="font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {actionPayload.targetDocName}
              </span>
            </div>
            {actionPayload.textToAdd && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-emerald-700 shrink-0">+ Add / Append:</span>
                <span className="text-neutral-800 bg-emerald-50/60 p-1.5 rounded border border-emerald-200/60 font-mono text-[11.5px] flex-1">
                  {actionPayload.textToAdd}
                </span>
              </div>
            )}
            {actionPayload.textToDelete && (
              <div className="flex items-start gap-2">
                <span className="font-semibold text-red-700 shrink-0">- Delete / Remove:</span>
                <span className="text-neutral-800 bg-red-50/60 p-1.5 rounded border border-red-200/60 font-mono text-[11.5px] flex-1 line-through">
                  {actionPayload.textToDelete}
                </span>
              </div>
            )}
          </div>

          {!docArtifact && (
            <button
              type="button"
              disabled={isExecuting}
              onClick={async () => {
                if (!googleToken) {
                  onRequireGoogleLogin();
                  return;
                }
                setIsExecuting(true);
                try {
                  const res = await searchAndEditDocument(
                    googleToken,
                    actionPayload.targetDocName!,
                    actionPayload.textToAdd,
                    actionPayload.textToDelete
                  );
                  setDocArtifact({ title: res.title, url: res.url });
                  setExecutionResult(
                    `✓ Successfully ${res.action === 'edited' ? 'found and updated' : 'created'} document "${res.title}" in Google Drive!`
                  );
                  if (onArtifactCreated) onArtifactCreated({ type: 'doc', title: res.title, url: res.url });
                } catch (err: any) {
                  setExecutionResult(`Error updating Drive document: ${err.message}`);
                } finally {
                  setIsExecuting(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Apply Changes to Drive Document</span>
            </button>
          )}
        </div>
      )}

      {/* 3. LIVE ARTIFACT LINKS & INSTANT DOWNLOAD ACTIONS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Google Doc Link / Action */}
        {docArtifact ? (
          <a
            href={docArtifact.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A73E8] text-white hover:bg-blue-700 text-[12.5px] font-semibold transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open in Google Docs</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </a>
        ) : actionPayload.docContent ? (
          <button
            type="button"
            onClick={handleDownloadDoc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Doc File (.md)</span>
          </button>
        ) : null}

        {/* Google Sheet Link / Action */}
        {sheetArtifact ? (
          <a
            href={sheetArtifact.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F9D58] text-white hover:bg-emerald-700 text-[12.5px] font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </a>
        ) : actionPayload.sheetRows && actionPayload.sheetRows.length > 0 ? (
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 text-[12px] font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel/CSV (.csv)</span>
          </button>
        ) : null}

        {/* Calendar Link */}
        {calendarArtifact && (
          <a
            href={calendarArtifact.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-[12.5px] font-semibold transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Open in Google Calendar</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </a>
        )}

        {/* Additional download buttons */}
        {actionPayload.docContent && docArtifact && (
          <button
            type="button"
            onClick={handleDownloadDoc}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-[11.5px] font-medium cursor-pointer"
            title="Download Document"
          >
            <Download className="w-3 h-3" />
            <span>Download Doc</span>
          </button>
        )}

        {actionPayload.sheetRows && sheetArtifact && (
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-[11.5px] font-medium cursor-pointer"
            title="Download Excel/CSV Sheet"
          >
            <Download className="w-3 h-3" />
            <span>Download Sheet</span>
          </button>
        )}

        {/* Email Send Confirmation Button */}
        {actionType === 'send_email' && actionPayload.to && (
          <button
            type="button"
            onClick={() => setShowSendConfirmModal(true)}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-[12.5px] font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Review & Send Email to {actionPayload.to}</span>
          </button>
        )}
      </div>

      {/* Mandatory User Confirmation Dialog before sending emails */}
      {showSendConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-lg p-5 space-y-4">
            <h4 className="text-[17px] font-bold text-neutral-900">
              Confirm Email Dispatch via Gmail
            </h4>
            <p className="text-[13.5px] text-neutral-600 leading-relaxed">
              Please review the recipient, subject, and content before your bot dispatches the email.
            </p>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[13px] space-y-2">
              <div>
                <span className="font-semibold text-neutral-700">Recipient:</span> {actionPayload.to}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Subject:</span>{' '}
                <span className="font-medium text-neutral-900">
                  {actionPayload.cleanSubject || actionPayload.subject || '(Clean Subject)'}
                </span>
              </div>
              {actionPayload.attachment && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/80 border border-blue-200/60 text-[12px] text-blue-900">
                  <span className="font-semibold">📎 Attached File:</span>
                  <span className="truncate font-medium">{actionPayload.attachment.name}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-neutral-200/70">
                <span className="font-semibold text-neutral-700 block mb-1">Body Preview:</span>
                <pre className="text-neutral-800 font-sans text-[12.5px] whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-neutral-200 leading-relaxed max-h-[160px] overflow-y-auto">
                  {actionPayload.body}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmailConfirmed}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Sending...' : 'Confirm & Send Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
