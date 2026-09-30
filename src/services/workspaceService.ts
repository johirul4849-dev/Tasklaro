// Google Workspace Live API Service

// Helper to encode UTF-8 to Base64URL for RFC 2822 email format
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Clean and RFC 2047 encode email subjects so characters never get corrupted
export function cleanAndEncodeSubject(subject: string): string {
  if (!subject) return 'Notification from AgentFlow';
  // Strip control chars, newlines, and excess quotes
  let clean = subject.replace(/[\r\n\t]+/g, ' ').replace(/^["']+|["']+$/g, '').trim();
  if (!clean) clean = 'Notification from AgentFlow';

  // If pure printable ASCII (spaces and letters/digits/standard punctuation), return as is
  if (/^[\x20-\x7E]+$/.test(clean)) {
    return clean;
  }

  // Use RFC 2047 MIME encoded-word syntax =?UTF-8?B?...?= for non-ASCII (Bengali, unicode symbols, etc.)
  const utf8Bytes = new TextEncoder().encode(clean);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export interface GmailEmailHeader {
  name: string;
  value: string;
}

export interface ParsedEmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  bodyText?: string;
  isMeetingRequest?: boolean;
}

export interface CalendarEventPayload {
  summary: string;
  description: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  attendees?: string[];
  reminderMinutes?: number; // default 5 minutes
  timeZone?: string;
}

export interface TaskItemPayload {
  id?: string;
  title: string;
  notes?: string;
  due?: string; // RFC 3339 timestamp with date and time
  status?: 'needsAction' | 'completed';
}

// 1. GMAIL API
export async function listGmailMessages(
  token: string,
  query: string = 'is:unread'
): Promise<ParsedEmailMessage[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch Gmail messages');
  }

  const data = await res.json();
  const messagesList = data.messages || [];

  const parsed: ParsedEmailMessage[] = [];
  for (const m of messagesList.slice(0, 5)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (msgRes.ok) {
        const fullMsg = await msgRes.json();
        const headers: GmailEmailHeader[] = fullMsg.payload?.headers || [];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        const isMeeting =
          /meet|meeting|calendar|zoom|google meet|schedule|appointment|interview|call/i.test(
            subject + ' ' + (fullMsg.snippet || '')
          );

        parsed.push({
          id: fullMsg.id,
          threadId: fullMsg.threadId,
          snippet: fullMsg.snippet || '',
          subject,
          from,
          date,
          isMeetingRequest: isMeeting,
        });
      }
    } catch {
      // Continue next message
    }
  }

  return parsed;
}

export async function markGmailAsRead(token: string, messageId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeLabelIds: ['UNREAD'],
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('Failed to mark email as read in Gmail:', err);
    return false;
  }
}

export async function sendGmailMessage(
  token: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
    attachment?: {
      name: string;
      type: string;
      base64?: string;
    };
  }
): Promise<{ id: string; threadId: string }> {
  const safeSubject = cleanAndEncodeSubject(params.subject);

  let rawMessage = '';
  if (params.attachment && params.attachment.base64) {
    const boundary = `agentflow_bnd_${Date.now()}`;
    rawMessage = `To: ${params.to}\r\n`;
    rawMessage += `Subject: ${safeSubject}\r\n`;
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    if (params.inReplyTo) {
      rawMessage += `In-Reply-To: ${params.inReplyTo}\r\n`;
      rawMessage += `References: ${params.inReplyTo}\r\n`;
    }
    rawMessage += `\r\n--${boundary}\r\n`;
    rawMessage += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    rawMessage += `Content-Transfer-Encoding: 8bit\r\n\r\n`;
    rawMessage += `${params.body}\r\n\r\n`;

    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: ${params.attachment.type || 'application/octet-stream'}; name="${params.attachment.name}"\r\n`;
    rawMessage += `Content-Transfer-Encoding: base64\r\n`;
    rawMessage += `Content-Disposition: attachment; filename="${params.attachment.name}"\r\n\r\n`;
    const cleanBase64 = params.attachment.base64.replace(/^data:[^;]+;base64,/, '');
    rawMessage += `${cleanBase64}\r\n\r\n`;
    rawMessage += `--${boundary}--\r\n`;
  } else {
    rawMessage = `To: ${params.to}\r\n`;
    rawMessage += `Subject: ${safeSubject}\r\n`;
    rawMessage += `MIME-Version: 1.0\r\n`;
    rawMessage += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    rawMessage += `Content-Transfer-Encoding: 8bit\r\n`;
    if (params.inReplyTo) {
      rawMessage += `In-Reply-To: ${params.inReplyTo}\r\n`;
      rawMessage += `References: ${params.inReplyTo}\r\n`;
    }
    rawMessage += `\r\n${params.body}`;
  }

  const encodedRaw = base64UrlEncode(rawMessage);

  const payload: any = { raw: encodedRaw };
  if (params.threadId) {
    payload.threadId = params.threadId;
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to send email via Gmail');
  }

  return await res.json();
}

// 2. GOOGLE CALENDAR API
export async function listCalendarEvents(
  token: string,
  timeMin?: string,
  timeMax?: string
): Promise<any[]> {
  const min = timeMin || new Date().toISOString();
  let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    min
  )}&singleEvents=true&orderBy=startTime&maxResults=15`;
  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to list Calendar events');
  }

  const data = await res.json();
  return data.items || [];
}

export async function createCalendarEvent(
  token: string,
  event: CalendarEventPayload
): Promise<any> {
  const reminderMins = event.reminderMinutes ?? 5; // User requirement: 5 minute reminder!
  const targetTimeZone = event.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';

  const eventResource = {
    summary: event.summary,
    description: event.description,
    start: {
      dateTime: event.startDateTime,
      timeZone: targetTimeZone,
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: targetTimeZone,
    },
    attendees: (event.attendees || []).map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMins },
        { method: 'email', minutes: reminderMins },
      ],
    },
  };

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventResource),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create event in Google Calendar');
  }

  return await res.json();
}

// 3. GOOGLE TASKS API
export async function listGoogleTasks(token: string): Promise<any[]> {
  const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listsRes.ok) {
    const err = await listsRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch task lists');
  }
  const listsData = await listsRes.json();
  const primaryList = (listsData.items && listsData.items[0]) || { id: '@default' };

  const tasksRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!tasksRes.ok) {
    const err = await tasksRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to fetch tasks');
  }
  const data = await tasksRes.json();
  return (data.items || []).map((it: any) => ({
    id: it.id,
    listId: primaryList.id,
    title: it.title,
    notes: it.notes || '',
    due: it.due,
    status: it.status,
  }));
}

export async function findGoogleTaskByTitle(token: string, searchTitle: string): Promise<any | null> {
  const tasks = await listGoogleTasks(token);
  const cleanSearch = searchTitle.toLowerCase().trim();
  return (
    tasks.find(
      (t) =>
        t.title.toLowerCase() === cleanSearch ||
        t.title.toLowerCase().includes(cleanSearch) ||
        cleanSearch.includes(t.title.toLowerCase())
    ) || null
  );
}

export async function createGoogleTask(
  token: string,
  task: TaskItemPayload
): Promise<any> {
  const payload: any = {
    title: task.title,
    notes: task.notes || '',
  };
  if (task.due) {
    payload.due = task.due;
  }

  const res = await fetch(
    'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create Google Task');
  }
  return await res.json();
}

export async function updateGoogleTask(
  token: string,
  taskId: string,
  task: Partial<TaskItemPayload>
): Promise<any> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to update Google Task');
  }
  return await res.json();
}

export async function deleteGoogleTask(token: string, taskId: string): Promise<void> {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to delete Google Task');
  }
}

// 4. GOOGLE DOCS API (Create Google Doc and insert content)
export async function createGoogleDoc(
  token: string,
  params: { title: string; content: string }
): Promise<{ documentId: string; title: string; url: string }> {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: params.title }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create Google Doc');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Insert text into document
  if (params.content && params.content.trim()) {
    try {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `${params.content}\n\nGenerated autonomously by AgentFlow Grok Bot`,
              },
            },
          ],
        }),
      });
    } catch {
      // Non-fatal if insert has index variation
    }
  }

  return {
    documentId,
    title: params.title,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

// 5. GOOGLE SHEETS API (Create Google Spreadsheet and populate rows)
export async function createGoogleSheet(
  token: string,
  params: { title: string; headers: string[]; rows: string[][] }
): Promise<{ spreadsheetId: string; title: string; url: string }> {
  // Step 1: Create empty spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: params.title },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to create Google Sheet');
  }

  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;

  // Step 2: Populate headers and rows
  const allValues = [params.headers, ...params.rows];
  if (allValues.length > 0) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: allValues,
          }),
        }
      );
    } catch {
      // Fallback
    }
  }

  return {
    spreadsheetId,
    title: params.title,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

// 6. CLIENT-SIDE FILE DOWNLOADER (CSV, DOCX/Markdown, TXT)
export function downloadFile(
  filename: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8'
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 7. CSV GENERATOR
export function exportToCsv(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (cell: any) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

// 8. GOOGLE DRIVE FOLDER & FILE SYNC
export async function getOrCreateDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; url: string }> {
  try {
    const q = parentFolderId
      ? `name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          id: data.files[0].id,
          name: data.files[0].name,
          url: data.files[0].webViewLink || `https://drive.google.com/drive/folders/${data.files[0].id}`,
        };
      }
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to create Drive folder');
    }

    const folder = await createRes.json();
    return {
      id: folder.id,
      name: folder.name,
      url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
    };
  } catch (error: any) {
    console.error('Drive folder error:', error);
    throw error;
  }
}

export async function uploadOrUpdateDriveFile(
  token: string,
  params: {
    name: string;
    content: string;
    mimeType?: string;
    folderId?: string;
  }
): Promise<{ fileId: string; name: string; url: string }> {
  const mimeType = params.mimeType || 'text/plain;charset=utf-8';

  try {
    // Check if file already exists in folder
    const q = params.folderId
      ? `name='${params.name.replace(/'/g, "\\'")}' and '${params.folderId}' in parents and trashed=false`
      : `name='${params.name.replace(/'/g, "\\'")}' and trashed=false`;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const existing = data.files[0];
        // Update content
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': mimeType,
            },
            body: params.content,
          }
        );
        if (updateRes.ok) {
          return {
            fileId: existing.id,
            name: existing.name,
            url: existing.webViewLink || `https://drive.google.com/file/d/${existing.id}/view`,
          };
        }
      }
    }

    // Create via multipart upload
    const boundary = '-------agentflow_sync_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: params.name,
      mimeType,
      parents: params.folderId ? [params.folderId] : undefined,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      params.content +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'Failed to upload file to Google Drive');
    }

    const created = await res.json();
    return {
      fileId: created.id,
      name: created.name,
      url: created.webViewLink || `https://drive.google.com/file/d/${created.id}/view`,
    };
  } catch (err: any) {
    console.error('Drive file upload error:', err);
    throw err;
  }
}
