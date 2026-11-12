/**
 * VectorRE - Rename Symbol / Function Modal (Shortcut 'N')
 */

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';

interface RenameModalProps {
  address: number;
  currentName: string;
  onApplyRename: (addr: number, newName: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  address,
  currentName,
  onApplyRename,
  onClose
}) => {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onApplyRename(address, name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161822] border border-[#2c3142] rounded-xl w-full max-w-md shadow-2xl p-5 font-sans text-xs select-none space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#252936]">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            <span>Rename Symbol / Function</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-slate-400 mb-1">
              Address: <span className="font-mono text-cyan-400">0x{address.toString(16)}</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0f1117] border border-[#292f3f] rounded text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
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
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
            >
              Rename (↵)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
