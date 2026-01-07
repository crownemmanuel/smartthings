'use client';

interface EmptyStateProps {
  onCreateShow: () => void;
}

export default function EmptyState({ onCreateShow }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/30">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        
        {/* Heading */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Get Started with Stage Control
        </h2>
        
        {/* Description */}
        <p className="text-zinc-400 mb-8 leading-relaxed">
          To begin creating scenes, managing devices, and building sequences, you'll need to create a show or load an existing one.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={onCreateShow}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Your First Show
        </button>
        
        {/* Help text */}
        <p className="mt-6 text-sm text-zinc-500">
          A show contains all your scenes, device groups, and sequences for a performance or event.
        </p>
      </div>
    </div>
  );
}
