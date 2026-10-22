import React from 'react';
import { HeartPulse, Loader2 } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white flex items-center justify-center shadow-lg animate-pulse">
          <HeartPulse className="h-8 w-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
        </div>
      </div>
      <h2 className="text-base font-bold text-slate-800 tracking-tight">
        Initializing Hospital Management System...
      </h2>
      <p className="mt-1 text-xs text-slate-500 max-w-xs">
        Loading clinical modules, user privileges, and active registries.
      </p>
    </div>
  );
}
