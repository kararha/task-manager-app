"use client";
import { Toaster } from 'react-hot-toast';

export default function ToasterContext() {
  return (
    <Toaster 
      position="bottom-center"
      toastOptions={{
        className: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-slate-100 font-semibold border border-slate-200/50 dark:border-slate-800/30 rounded-2xl shadow-lg px-6 py-4',
        style: {
          background: 'none',
          boxShadow: 'none',
          border: 'none',
          padding: 0,
        }
      }}
    />
  );
}
