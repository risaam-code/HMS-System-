import React from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Info, ExternalLink, ShieldCheck } from 'lucide-react';

export function SetupModeBanner() {
  const isReady = isSupabaseConfigured();

  if (isReady) return null;

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-blue-900">
                HMS Foundation Mode: Temporary Mock Data Active
              </h4>
              <span className="inline-flex items-center rounded-full bg-blue-200/70 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                Dev Preview
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-700 leading-relaxed">
              The application foundation is currently active using realistic development placeholders.
              To connect your live PostgreSQL database, copy <code className="px-1 py-0.5 bg-blue-100 rounded text-[11px] font-mono">.env.example</code> to <code className="px-1 py-0.5 bg-blue-100 rounded text-[11px] font-mono">.env</code> and provide your Supabase URL & Anon Key.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-2xs"
          >
            <span>Supabase Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
