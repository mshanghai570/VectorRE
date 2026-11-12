/**
 * VectorRE - Comment Editor Modal (Shortcut ';')
 */

import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface CommentModalProps {
  address: number;
  currentComment?: string;
  onApplyComment: (addr: number, comment: string) => void;
  onClose: () => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  address,
  currentComment = '',
  onApplyComment,
  onClose
}) => {
  const [comment, setComment] = useState(currentComment);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyComment(address, comment.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161822] border border-[#2c3142] rounded-xl w-full max-w-md shadow-2xl p-5 font-sans text-xs select-none space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>Add / Edit Disassembly Comment</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1">
              Comment at <span className="font-mono text-cyan-400">0x{address.toString(16)}</span>:
            </label>
            <input
              type="text"
              placeholder="e.g. anti-debug check or encryption key buffer"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f1117] border border-[#292f3f] rounded text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium"
            >
              Save Comment (↵)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
