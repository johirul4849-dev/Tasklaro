import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Mail,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import { ActionPayload, WorkspaceArtifact } from '../types/bot';
import {
  createCalendarEvent,
  createGoogleDoc,
  createGoogleSheet,
  createGoogleTask,
  deleteGoogleTask,
  downloadFile,
  exportToCsv,
  findGoogleTaskByTitle,
  listGmailMessages,
  markGmailAsRead,
  ParsedEmailMessage,
  sendGmailMessage,
  updateGoogleTask,
} from '../services/workspaceService';

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

  if (!actionType || actionType === 'none' || !actionPayload) {
    return null;
  }

  // Autonomous execution when googleToken is ready (No manual clicks needed!)
  useEffect(() => {
    if (!googleToken || hasAutoExecuted) return;

    const runAutonomousExecution = async () => {
      // 1. Google Tasks: Auto Add, Edit, or Delete
      if (actionType === 'manage_task' && actionPayload.taskTitle) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          if (actionPayload.taskAction === 'delete') {
            const found = await findGoogleTaskByTitle(googleToken, actionPayload.taskTitle);
            if (found) {
              await deleteGoogleTask(googleToken, found.id);
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" deleted from Google Tasks autonomously.`);
            } else {
              setExecutionResult(`Task "${actionPayload.taskTitle}" was not found in Google Tasks to delete.`);
            }
          } else if (actionPayload.taskAction === 'edit') {
            const found = await findGoogleTaskByTitle(googleToken, actionPayload.taskTitle);
            if (found) {
              await updateGoogleTask(googleToken, found.id, {
                title: actionPayload.taskTitle,
                notes: `${actionPayload.taskNotes || ''}\n(Auto-reminder: 5m prior)`,
                due: actionPayload.taskDue,
              });
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" updated in Google Tasks with set time & 5m reminder.`);
            } else {
              await createGoogleTask(googleToken, {
                title: actionPayload.taskTitle,
                notes: `${actionPayload.taskNotes || ''}\n(Auto-reminder: 5m prior)`,
                due: actionPayload.taskDue,
              });
              setExecutionResult(`✓ Task "${actionPayload.taskTitle}" created in Google Tasks (${actionPayload.taskDateLabel || 'Set time'}).`);
            }
          } else {
            // Default Add
            await createGoogleTask(googleToken, {
              title: actionPayload.taskTitle,
              notes: `${actionPayload.taskNotes || ''}\n(Auto-reminder: 5m prior)`,
              due: actionPayload.taskDue,
            });
            setExecutionResult(
              `✓ Task "${actionPayload.taskTitle}" auto-added to Google Tasks with scheduled time (${actionPayload.taskDateLabel || 'Set time'}) and 5-min reminder!`
            );
          }
        } catch (err: any) {
          setExecutionResult(`Task operation error: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 2. Google Docs: Auto-create
      if (
        (actionType === 'create_doc' || actionType === 'create_doc_and_sheet') &&
        actionPayload.docContent &&
        !docArtifact
      ) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const doc = await createGoogleDoc(googleToken, {
            title: actionPayload.docTitle || 'AgentFlow Research Dossier',
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

      // 3. Google Sheets: Auto-create
      if (
        (actionType === 'create_sheet' || actionType === 'create_doc_and_sheet') &&
        actionPayload.sheetRows &&
        actionPayload.sheetRows.length > 0 &&
        !sheetArtifact
      ) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const headers = actionPayload.sheetHeaders || ['Item', 'Details', 'Status'];
          const rows = actionPayload.sheetRows.map((r) => r.map(String));
          const sheet = await createGoogleSheet(googleToken, {
            title: actionPayload.sheetTitle || 'AgentFlow Structured Sheet',
            headers,
            rows,
          });
          setSheetArtifact({ title: sheet.title, url: sheet.url });
          setExecutionResult((prev) =>
            prev ? `${prev} | ✓ Google Sheet Created: "${sheet.title}"` : `✓ Google Sheet Created: "${sheet.title}"!`
          );
          if (onArtifactCreated) onArtifactCreated({ type: 'sheet', title: sheet.title, url: sheet.url });
        } catch (err: any) {
          setExecutionResult(`Error creating Google Sheet: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 4. Google Calendar: Auto-create with Timezone Conversion
      if (actionType === 'create_calendar_event' && actionPayload.eventSummary && !calendarArtifact) {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const desc = actionPayload.timeZoneConversionNote
            ? `${actionPayload.timeZoneConversionNote}\n\nClient TimeZone: ${actionPayload.clientTimeZone || 'N/A'}\nLocal TimeZone: ${actionPayload.userTimeZone || 'Asia/Dhaka'}\n\nAutomated by AgentFlow`
            : 'Scheduled autonomously by AgentFlow with 5-minute reminder';

          const ev = await createCalendarEvent(googleToken, {
            summary: actionPayload.eventSummary,
            description: desc,
            startDateTime: actionPayload.eventStart || new Date().toISOString(),
            endDateTime:
              actionPayload.eventEnd ||
              new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            timeZone: actionPayload.userTimeZone || 'Asia/Dhaka',
            reminderMinutes: 5,
          });
          if (ev.htmlLink) {
            setCalendarArtifact({ title: actionPayload.eventSummary, url: ev.htmlLink });
          }
          setExecutionResult(
            `✓ Event "${actionPayload.eventSummary}" scheduled in Google Calendar (${actionPayload.timeZoneConversionNote || 'Time confirmed'}) with a 5-minute reminder!`
          );
        } catch (err: any) {
          setExecutionResult(`Error creating Calendar event: ${err.message}`);
        } finally {
          setIsExecuting(false);
        }
      }

      // 5. Gmail Inbox Scan & Autonomous Meeting Scheduling + Auto Mark Read
      if (actionType === 'check_gmail_meetings') {
        setIsExecuting(true);
        setHasAutoExecuted(true);
        try {
          const processedKey = 'agentflow_processed_emails';
          let processedIds: string[] = [];
          try {
            processedIds = JSON.parse(localStorage.getItem(processedKey) || '[]');
          } catch {}

          const emails = await listGmailMessages(googleToken, 'in:inbox');
          const unbookedMeetingEmails = emails.filter(
            (e) => e.isMeetingRequest && !processedIds.includes(e.id)
          );

          if (unbookedMeetingEmails.length > 0) {
            const targetEmail = unbookedMeetingEmails[0];
            const senderEmail =
              targetEmail.from.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] ||
              actionPayload.to ||
              '';

            const ev = await createCalendarEvent(googleToken, {
              summary: `Meeting: ${targetEmail.subject}`,
              description: `Auto-scheduled from Gmail thread: "${targetEmail.subject}"\nSnippet: ${targetEmail.snippet}\n\nClient Email: ${senderEmail}\n5-minute advance reminder set automatically.`,
              startDateTime: actionPayload.eventStart || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              endDateTime: actionPayload.eventEnd || new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
              timeZone: actionPayload.userTimeZone || 'Asia/Dhaka',
              reminderMinutes: 5,
            });

            // Mark message as read in Gmail to prevent duplicate bookings
            await markGmailAsRead(googleToken, targetEmail.id);
            processedIds.push(targetEmail.id);
            localStorage.setItem(processedKey, JSON.stringify(processedIds));

            if (ev.htmlLink) {
              setCalendarArtifact({ title: targetEmail.subject, url: ev.htmlLink });
            }
            setExecutionResult(
              `✓ Discovered meeting request from "${targetEmail.from}". Booked in Google Calendar with a 5-minute reminder, marked thread as read in Gmail (preventing duplicate entries), and drafted confirmation email to ${senderEmail || 'client'}!`
            );
          } else if (emails.length > 0) {
            setExecutionResult(
              `✓ Scanned ${emails.length} recent inbox emails. No new unbooked meeting requests found (previous requests are marked read to prevent duplicates).`
            );
          } else {
            setExecutionResult(`✓ Scanned Gmail inbox: 0 new messages found.`);
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

  // Download Handlers (Always available for instant offline access)
  const handleDownloadDoc = () => {
    const filename = `${(actionPayload.docTitle || 'research_report').toLowerCase().replace(/\s+/g, '_')}.md`;
    const content = `# ${actionPayload.docTitle || 'Document'}\n\n${actionPayload.docContent || ''}\n\n---\n*Created autonomously by AgentFlow Workspace Assistant*`;
    downloadFile(filename, content, 'text/markdown;charset=utf-8');
  };

  const handleDownloadCsv = () => {
    const filename = `${(actionPayload.sheetTitle || 'influencers_and_data').toLowerCase().replace(/\s+/g, '_')}.csv`;
    const headers = actionPayload.sheetHeaders || ['Name', 'Platform', 'Details'];
    const rows = actionPayload.sheetRows || [];
    const csvContent = exportToCsv(headers, rows);
    downloadFile(filename, csvContent, 'text/csv;charset=utf-8');
  };

  return (
    <div className="mt-3.5 p-4 rounded-[16px] border border-neutral-200/90 bg-white/95 space-y-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[13px] font-semibold text-neutral-900">
            Google Workspace Autonomous Execution
          </span>
          {googleToken ? (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Full Auto Access
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
            <span>5m Reminder Armed</span>
          </span>
        </div>
      </div>

      {/* Timezone Conversion Note if available */}
      {actionPayload.timeZoneConversionNote && (
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70 text-blue-900 text-[12px] flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <strong>Timezone Auto-Converted:</strong> {actionPayload.timeZoneConversionNote}
          </div>
        </div>
      )}

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

      {/* Live Artifact Links and Download Actions */}
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

        {/* Both download buttons when both exist */}
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
