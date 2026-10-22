import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
        404 Error
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
        Hospital Record or Module Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        The requested clinical resource, patient file, or navigation route could not be found.
        It may have been moved, archived, or you may have entered an incorrect URL.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
        >
          Go Back
        </Button>
        <Link to="/dashboard">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home className="h-3.5 w-3.5" />}
          >
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
