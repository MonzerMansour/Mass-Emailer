import { Send, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import type { Recipient, SendResult } from '../types';
import { fillTemplate } from '../lib/template';
import { sendEmail } from '../lib/gmail';

interface Props {
  recipients: Recipient[];
  subject: string;
  body: string;
  fromEmail: string;
  accessToken: string;
  results: SendResult[];
  onResultsChange: (r: SendResult[] | ((prev: SendResult[]) => SendResult[])) => void;
}

export default function SendStep({ recipients, subject, body, fromEmail, accessToken, results, onResultsChange }: Props) {
  const isSending = results.some(r => r.status === 'sending');
  const sentCount = results.filter(r => r.status === 'sent').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const canSend = recipients.length > 0 && subject.trim() && body.trim() && !isSending;

  async function handleSend() {
    const initial: SendResult[] = recipients.map(r => ({ recipientId: r.id, email: r.email, status: 'pending' }));
    onResultsChange(initial);

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      onResultsChange(prev => prev.map(p => p.recipientId === r.id ? { ...p, status: 'sending' } : p));

      try {
        const filledSubject = fillTemplate(subject, r);
        const filledBody = fillTemplate(body, r);
        await sendEmail(accessToken, fromEmail, r.email, filledSubject, filledBody);
        onResultsChange(prev => prev.map(p => p.recipientId === r.id ? { ...p, status: 'sent' } : p));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        onResultsChange(prev => prev.map(p => p.recipientId === r.id ? { ...p, status: 'error', error: msg } : p));
      }

      // Small delay to avoid hitting Gmail rate limits
      if (i < recipients.length - 1) await new Promise(res => setTimeout(res, 200));
    }
  }

  const noRecipients = recipients.length === 0;
  const noSubject = !subject.trim();
  const noBody = !body.trim();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Send size={18} className="text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Send</h2>
      </div>

      {/* Summary card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-sm text-gray-400">Sending from <span className="text-white font-medium">{fromEmail}</span></p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Recipients</span>
            <p className="text-white font-medium">{recipients.length}</p>
          </div>
          <div>
            <span className="text-gray-500">Subject</span>
            <p className="text-white font-medium truncate max-w-xs">{subject || <span className="text-gray-600 italic">not set</span>}</p>
          </div>
        </div>

        {(noRecipients || noSubject || noBody) && (
          <div className="flex flex-col gap-1">
            {noRecipients && <Blocker>Add at least one recipient first.</Blocker>}
            {noSubject && <Blocker>Subject line is empty.</Blocker>}
            {noBody && <Blocker>Email body is empty.</Blocker>}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl transition-colors w-full mt-1"
        >
          {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          {isSending ? `Sending… ${sentCount + errorCount}/${recipients.length}` : `Send ${recipients.length} email${recipients.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Progress list */}
      {results.length > 0 && (
        <div className="flex flex-col gap-1">
          {sentCount > 0 && !isSending && (
            <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
              <CheckCircle size={16} /> {sentCount} sent successfully{errorCount > 0 ? `, ${errorCount} failed` : ''}
            </div>
          )}
          {results.map(r => (
            <div key={r.recipientId} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-900 text-sm">
              <StatusIcon status={r.status} />
              <span className="text-gray-300 flex-1">{r.email}</span>
              {r.error && <span className="text-red-400 text-xs">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: SendResult['status'] }) {
  if (status === 'sent') return <CheckCircle size={14} className="text-green-400 shrink-0" />;
  if (status === 'error') return <XCircle size={14} className="text-red-400 shrink-0" />;
  if (status === 'sending') return <Loader size={14} className="text-blue-400 animate-spin shrink-0" />;
  return <div className="w-3.5 h-3.5 rounded-full border border-gray-700 shrink-0" />;
}

function Blocker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-yellow-500">
      <AlertTriangle size={12} /> {children}
    </div>
  );
}
