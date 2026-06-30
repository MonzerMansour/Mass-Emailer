import { FileText, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { extractVariables, fillTemplate } from '../lib/template';
import type { Recipient } from '../types';

interface Props {
  subject: string;
  body: string;
  columns: string[];
  recipients: Recipient[];
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
}

export default function TemplateStep({ subject, body, columns, recipients, onSubjectChange, onBodyChange }: Props) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const usedVars = [...new Set([...extractVariables(subject), ...extractVariables(body)])];
  const availableVars = ['email', ...columns];
  const missingVars = usedVars.filter(v => !availableVars.includes(v));

  const previewRecipient = recipients[previewIdx];
  const previewSubject = previewRecipient ? fillTemplate(subject, previewRecipient) : subject;
  const previewBody = previewRecipient ? fillTemplate(body, previewRecipient) : body;

  function insertVar(v: string) {
    onBodyChange(body + `<${v}>`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Email Template</h2>
      </div>

      {/* Available variables */}
      {availableVars.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Insert variable:</span>
          {availableVars.map(v => (
            <button
              key={v}
              onClick={() => insertVar(v)}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-blue-300 px-2 py-1 rounded-lg font-mono transition-colors"
            >
              {'<'}{v}{'>'}
            </button>
          ))}
        </div>
      )}

      {/* Missing variables warning */}
      {missingVars.length > 0 && (
        <div className="text-xs bg-yellow-900/30 border border-yellow-800 text-yellow-400 px-3 py-2 rounded-lg">
          Variables used but not in your data: {missingVars.map(v => `<${v}>`).join(', ')} — these will be left as-is.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</label>
        <input
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Hey <name>, we'd love to connect!"
          value={subject}
          onChange={e => onSubjectChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Body</label>
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
          placeholder={`Hi <name>,\n\nI saw you're at <school> — I wanted to reach out...\n\nBest,\nMonzer`}
          value={body}
          rows={12}
          onChange={e => onBodyChange(e.target.value)}
        />
      </div>

      {/* Preview toggle */}
      {recipients.length > 0 && (subject || body) && (
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            {showPreview ? 'Hide preview' : 'Preview for a recipient'}
          </button>

          {showPreview && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Preview for:</span>
                <select
                  className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                  value={previewIdx}
                  onChange={e => setPreviewIdx(Number(e.target.value))}
                >
                  {recipients.map((r, i) => (
                    <option key={r.id} value={i}>{r.email}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Subject</span>
                  <p className="text-white mt-1 text-sm">{previewSubject || <span className="text-gray-600 italic">empty</span>}</p>
                </div>
                <div className="border-t border-gray-800" />
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Body</span>
                  <pre className="text-white mt-1 text-sm whitespace-pre-wrap font-sans leading-relaxed">{previewBody || <span className="text-gray-600 italic">empty</span>}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
