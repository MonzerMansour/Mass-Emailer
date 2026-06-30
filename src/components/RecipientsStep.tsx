import { useState } from 'react';
import { Users, ClipboardPaste, Trash2, AlertCircle, Plus, X } from 'lucide-react';
import type { Recipient } from '../types';
import { parsePaste } from '../lib/parse';

interface Props {
  recipients: Recipient[];
  columns: string[];
  onUpdate: (recipients: Recipient[], columns: string[]) => void;
}

export default function RecipientsStep({ recipients, columns, onUpdate }: Props) {
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [addingCol, setAddingCol] = useState(false);

  const allCols = ['email', ...columns];

  // --- manual table helpers ---
  function addRow() {
    const blank: Recipient = { id: crypto.randomUUID(), email: '' };
    columns.forEach(c => { blank[c] = ''; });
    onUpdate([...recipients, blank], columns);
  }

  function removeRow(id: string) {
    onUpdate(recipients.filter(r => r.id !== id), columns);
  }

  function updateCell(id: string, key: string, value: string) {
    onUpdate(recipients.map(r => r.id === id ? { ...r, [key]: value } : r), columns);
  }

  function addColumn() {
    const name = newColName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!name || columns.includes(name)) return;
    const newCols = [...columns, name];
    const newRecs = recipients.map(r => ({ ...r, [name]: '' }));
    onUpdate(newRecs, newCols);
    setNewColName('');
    setAddingCol(false);
  }

  function removeColumn(col: string) {
    const newCols = columns.filter(c => c !== col);
    const newRecs = recipients.map(r => { const copy = { ...r }; delete copy[col]; return copy; });
    onUpdate(newRecs, newCols);
  }

  // --- paste import ---
  function handleImport() {
    const { recipients: parsed, columns: cols, error } = parsePaste(pasteText);
    if (error) { setPasteError(error); return; }
    setPasteError('');
    onUpdate(parsed, cols);
    setShowPaste(false);
    setPasteText('');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Recipients</h2>
          {recipients.length > 0 && (
            <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">
              {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowPaste(!showPaste); setPasteError(''); }}
          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ClipboardPaste size={15} />
          Import from spreadsheet
        </button>
      </div>

      {/* Paste area */}
      {showPaste && (
        <div className="flex flex-col gap-3 bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div>
            <p className="text-sm text-gray-300 mb-1">Copy rows from Google Sheets or Excel and paste below.</p>
            <p className="text-xs text-gray-500">
              First row = headers. Must include a column called <code className="bg-gray-800 px-1 rounded">email</code>.
              Tabs, commas, or period-separated all work.
            </p>
          </div>
          <textarea
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none h-28"
            placeholder={"email\tname\tschool\njohn@example.com\tJohn\tMIT"}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          {pasteError && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} /> {pasteError}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={!pasteText.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Import
            </button>
            <button onClick={() => setShowPaste(false)} className="text-sm text-gray-500 hover:text-white px-4 py-2 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap w-8">
                #
              </th>
              {/* email col — fixed, no delete */}
              <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                email
              </th>
              {/* extra columns */}
              {columns.map(col => (
                <th key={col} className="text-left px-3 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {col}
                    <button onClick={() => removeColumn(col)} className="text-gray-700 hover:text-red-400 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </th>
              ))}
              {/* add column header */}
              <th className="px-3 py-2.5 whitespace-nowrap">
                {addingCol ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-xs text-white w-24 focus:outline-none focus:border-blue-500"
                      placeholder="column name"
                      value={newColName}
                      onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setAddingCol(false); }}
                    />
                    <button onClick={addColumn} className="text-blue-400 hover:text-blue-300 text-xs px-1">✓</button>
                    <button onClick={() => setAddingCol(false)} className="text-gray-500 hover:text-white text-xs px-1">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCol(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors whitespace-nowrap"
                  >
                    <Plus size={12} /> column
                  </button>
                )}
              </th>
              <th className="px-3 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 ? (
              <tr>
                <td colSpan={allCols.length + 3} className="text-center py-10 text-gray-600 text-sm">
                  No recipients yet — add a row or import from a spreadsheet.
                </td>
              </tr>
            ) : recipients.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/40'}>
                <td className="px-3 py-1.5 text-gray-600 text-xs">{i + 1}</td>
                {allCols.map(col => (
                  <td key={col} className="px-3 py-1.5">
                    <input
                      className="w-full bg-transparent text-white focus:outline-none focus:bg-gray-800 rounded px-1 py-0.5 min-w-[100px]"
                      value={r[col] ?? ''}
                      placeholder={col === 'email' ? 'email@example.com' : col}
                      onChange={e => updateCell(r.id, col, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-3 py-1.5" />
                <td className="px-3 py-1.5">
                  <button onClick={() => removeRow(r.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row footer */}
        <div className="bg-gray-950 border-t border-gray-800 px-3 py-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors"
          >
            <Plus size={14} /> Add row
          </button>
        </div>
      </div>
    </div>
  );
}
