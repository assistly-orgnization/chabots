'use client';

import dynamic from 'next/dynamic';

const AssistlyChat = dynamic(
  () => import('@shaimaababiker/embed').then((m) => m.AssistlyChat),
  { ssr: false }
);

export default function TestEmbedPage() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a2a2a',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          height: 'min(720px, 90vh)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        }}
      >
        <AssistlyChat
          chatbotId={1}
          origin="https://chatbot-xi-rose-68.vercel.app"
          primaryColor="#b8893a"
        />
      </div>
    </div>
  );
}
