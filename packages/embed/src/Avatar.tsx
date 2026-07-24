'use client';

import React from 'react';
import { rings } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

/**
 * Browser-safe base64 encoder. The original `components/ui/Avatar.tsx`
 * uses `Buffer.from(...).toString('base64')` which depends on a Node.js
 * global. That works in the Next.js main app (which polyfills `Buffer`)
 * but throws in any customer bundle, so this copy replaces it.
 */
function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function Avatar({ seed, className }: { seed: string; className?: string }) {
  const avatar = createAvatar(rings, { seed });
  const svg = avatar.toString();
  const dataUrl = `data:image/svg+xml;base64,${utf8ToBase64(svg)}`;

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Avatar" width={80} height={80} className={className} />
    </div>
  );
}

export default Avatar;
