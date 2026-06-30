import { useState, useEffect, useCallback } from 'react';
import { Mail, LogOut, Users, FileText, Send, ChevronRight } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import RecipientsStep from './components/RecipientsStep';
import TemplateStep from './components/TemplateStep';
import SendStep from './components/SendStep';
import { parseCodeFromUrl, startOAuthFlow } from './lib/oauth';
import { fetchUserEmail } from './lib/gmail';
import type { Recipient, SendResult } from './types';

const STEPS = [
  { id: 'recipients', label: 'Recipients', icon: Users },
  { id: 'template', label: 'Template', icon: FileText },
  { id: 'send', label: 'Send', icon: Send },
] as const;
type StepId = typeof STEPS[number]['id'];

const CLIENT_ID = '699416594092-pdq1om7eidmcu60vc0k5ib0o6g96td99.apps.googleusercontent.com';

const STORAGE_KEYS = {
  accessToken: 'mes_access_token',
  fromEmail: 'mes_from_email',
  tokenExpiry: 'mes_token_expiry',
};

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [fromEmail, setFromEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [step, setStep] = useState<StepId>('recipients');

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [results, setResults] = useState<SendResult[]>([]);

  useEffect(() => {
    parseCodeFromUrl()
      .then(parsed => {
        if (parsed) {
          const expiry = Date.now() + parsed.expiresIn * 1000;
          localStorage.setItem(STORAGE_KEYS.accessToken, parsed.accessToken);
          localStorage.setItem(STORAGE_KEYS.tokenExpiry, String(expiry));
          setAccessToken(parsed.accessToken);
          return;
        }
        const stored = localStorage.getItem(STORAGE_KEYS.accessToken);
        const expiry = Number(localStorage.getItem(STORAGE_KEYS.tokenExpiry) ?? 0);
        if (stored && Date.now() < expiry) setAccessToken(stored);
      })
      .catch(err => {
        setAuthError(err instanceof Error ? err.message : String(err));
        const stored = localStorage.getItem(STORAGE_KEYS.accessToken);
        const expiry = Number(localStorage.getItem(STORAGE_KEYS.tokenExpiry) ?? 0);
        if (stored && Date.now() < expiry) setAccessToken(stored);
      });
  }, []);

  const signOut = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    setAccessToken(null);
    setFromEmail('');
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const cached = localStorage.getItem(STORAGE_KEYS.fromEmail);
    if (cached) { setFromEmail(cached); return; }
    fetchUserEmail(accessToken)
      .then(email => { setFromEmail(email); localStorage.setItem(STORAGE_KEYS.fromEmail, email); })
      .catch(() => signOut());
  }, [accessToken, signOut]);

  const handleReconnect = useCallback(() => {
    startOAuthFlow(CLIENT_ID);
  }, []);

  const updateResults = useCallback((update: SendResult[] | ((prev: SendResult[]) => SendResult[])) => {
    setResults(prev => typeof update === 'function' ? update(prev) : update);
  }, []);

  if (!accessToken) {
    return <LoginScreen onLogin={() => startOAuthFlow(CLIENT_ID)} error={authError} />;
  }

  const currentIdx = STEPS.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Mail size={14} className="text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Mass Email Sender</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{fromEmail}</span>
            <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1 flex flex-col gap-6">
        <nav className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={14} className="text-gray-700" />}
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="flex-1">
          {step === 'recipients' && (
            <RecipientsStep
              recipients={recipients}
              columns={columns}
              onUpdate={(r, c) => { setRecipients(r); setColumns(c); setResults([]); }}
            />
          )}
          {step === 'template' && (
            <TemplateStep
              subject={subject}
              body={body}
              columns={columns}
              recipients={recipients}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
            />
          )}
          {step === 'send' && (
            <SendStep
              recipients={recipients}
              subject={subject}
              body={body}
              fromEmail={fromEmail}
              accessToken={accessToken}
              results={results}
              onResultsChange={updateResults}
            />
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-800">
          <button
            onClick={() => currentIdx > 0 && setStep(STEPS[currentIdx - 1].id)}
            disabled={currentIdx === 0}
            className="text-sm text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => currentIdx < STEPS.length - 1 && setStep(STEPS[currentIdx + 1].id)}
            disabled={currentIdx === STEPS.length - 1}
            className="text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
}
