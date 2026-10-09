import React from 'react';
import { AddressCleanResult } from '../types';

interface AddressCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AddressCleanResult | null;
  isLoading: boolean;
  onConfirmCleaned: (cleanedAddress: string) => void;
  onKeepOriginal: () => void;
}

export const AddressCleanupModal: React.FC<AddressCleanupModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onConfirmCleaned,
  onKeepOriginal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">auto_fix_high</span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-slate-900 leading-tight">
                Address Verification & Cleanup
              </h3>
              <p className="text-xs text-slate-500">Autonomous Rover Navigation Normalizer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Data Minimization Note */}
        <div className="my-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-emerald-600">lock</span>
          <span>Privacy: Only the address text was evaluated. No customer phone or PII was sent.</span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <span className="material-symbols-outlined text-[36px] text-emerald-600 animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-slate-800">Normalizing with Gemini LLM...</p>
            <p className="text-xs text-slate-500 max-w-[260px]">
              Formatting street nomenclature and postal codes for automated doorstep robotics docking.
            </p>
          </div>
        ) : result ? (
          <div className="space-y-3 py-1">
            {/* Original Input */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                Original Input
              </span>
              <p className="text-slate-700 font-mono break-words">{result.original}</p>
            </div>

            {/* Cleaned Recommended Output */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border-2 border-emerald-500/80 shadow-xs relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Normalized Rover Target
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  {result.confidenceScore}% Confidence
                </span>
              </div>
              <p className="font-semibold text-slate-900 text-sm">{result.cleaned}</p>

              {/* Parsed Structure Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {result.city && (
                  <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-slate-600">
                    City: {result.city}
                  </span>
                )}
                {result.state && (
                  <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-slate-600">
                    State: {result.state}
                  </span>
                )}
                {result.postalCode && (
                  <span className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-slate-600">
                    Zip: {result.postalCode}
                  </span>
                )}
              </div>
            </div>

            {/* Modifications list */}
            {result.modifications && result.modifications.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-600">Optimizations applied:</span>
                <ul className="text-xs text-slate-600 space-y-1 pl-1">
                  {result.modifications.map((mod, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">
                        task_alt
                      </span>
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => result && onConfirmCleaned(result.cleaned)}
            disabled={isLoading || !result}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Confirm Cleaned Address</span>
          </button>

          <button
            onClick={onKeepOriginal}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
          >
            Keep Original
          </button>
        </div>
      </div>
    </div>
  );
};
