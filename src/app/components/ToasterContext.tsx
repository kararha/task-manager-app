"use client";
import { Toaster } from 'react-hot-toast';

export default function ToasterContext() {
  return (
    <Toaster 
      position="bottom-center"
      toastOptions={{
        style: {
          background: '#E0E5EC',
          color: '#2D3748',
          boxShadow: '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
          borderRadius: '24px',
          padding: '16px 24px',
          fontWeight: 'bold',
          border: '1px solid rgba(255,255,255,0.4)',
        }
      }}
    />
  );
}
