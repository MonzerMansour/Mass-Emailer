import type { Recipient } from '../types';

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes('. ')) return '. ';
  if (line.includes(',')) return ',';
  if (line.includes(';')) return ';';
  return '\t';
}

export function parsePaste(text: string): { recipients: Recipient[]; columns: string[]; error?: string } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { recipients: [], columns: [], error: 'Paste at least a header row and one data row.' };

  const delim = detectDelimiter(lines[0]);
  const splitLine = (line: string) => line.split(delim).map(c => c.trim().replace(/\.$/, '').trim());

  const headers = splitLine(lines[0]).map(h => h.toLowerCase());
  const emailIdx = headers.indexOf('email');
  if (emailIdx === -1) return { recipients: [], columns: [], error: 'No "email" column found. Make sure your first row has a column called "email".' };

  const recipients: Recipient[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.every(c => !c)) continue;
    const rec: Recipient = { id: crypto.randomUUID(), email: '' };
    headers.forEach((h, idx) => { rec[h] = cells[idx] ?? ''; });
    if (!rec.email) continue;
    recipients.push(rec);
  }

  return { recipients, columns: headers.filter(h => h !== 'email') };
}
