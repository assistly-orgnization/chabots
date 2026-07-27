/* Smoke test for the Assistly embed widget.
 *
 * This test catches the high-cost failure modes for code I just wrote:
 *   1. Imports resolve and the bundle doesn't throw on mount.
 *   2. The injected <style data-assistly-style> tag actually lands in <head>.
 *   3. Key structural elements are present (header, input, send button,
 *      secure badge, messages area).
 *   4. The `primaryColor` prop reaches the wrapper as a CSS variable.
 *
 * It does NOT verify the visual aesthetic — that needs a human eye in
 * a real browser. Run `pnpm dev` in packages/embed and view it. */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import React from 'react';
import AssistlyChat from './widget';
import { ensureAssistlyStyles, __resetAssistlyStylesForTests } from './lib/injectStyles';
import assistlyCss from './lib/styles';

afterEach(() => cleanup());

describe('AssistlyChat', () => {
  beforeEach(() => {
    document.head.querySelectorAll('style[data-assistly-style]').forEach((el) => el.remove());
    __resetAssistlyStylesForTests();
  });

  it('injects a <style> tag with the assistly stylesheet on mount', () => {
    // Sanity: the bundled CSS should be non-empty and contain our tokens.
    expect(assistlyCss).toBeTypeOf('string');
    expect(assistlyCss.length).toBeGreaterThan(500);
    expect(assistlyCss).toContain('--assistly-paper');
    expect(assistlyCss).toContain('--assistly-brass');
    expect(assistlyCss).toContain('.assistly-prose');

    // Sanity: ensureAssistlyStyles actually creates the tag.
    ensureAssistlyStyles(assistlyCss);
    const tag = document.head.querySelector('style[data-assistly-style]');
    expect(tag).toBeTruthy();
    expect(tag?.textContent).toBe(assistlyCss);
  });

  it('renders the widget shell with header, input, and send button', async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <AssistlyChat
          chatbotId={42}
          origin="https://example.com"
          primaryColor="#cc0000"
        />
      );
    });
    const { container } = result!;

    // Header — chatbot name appears at least once
    expect(screen.getAllByText('Assistant').length).toBeGreaterThan(0);
    expect(screen.getByText('Secure')).toBeTruthy();

    // Online status text
    expect(screen.getByText(/Online/)).toBeTruthy();

    // Input placeholder reflects the current onboarding step
    const input = screen.getByPlaceholderText('Your name…') as HTMLInputElement;
    expect(input).toBeTruthy();

    // Send button has the right label
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeTruthy();

    // Send button starts disabled (zod requires min 3 chars, empty input fails)
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);

    // Tagline at the bottom
    expect(screen.getByText(/Powered by SMOEDESIGN/)).toBeTruthy();

    // The injected <style> tag is present after mount
    expect(document.head.querySelector('style[data-assistly-style]')).toBeTruthy();

    // The root wrapper exists with the assistly-root class
    const root = container.querySelector('.assistly-root') as HTMLElement;
    expect(root).toBeTruthy();
    expect(root.getAttribute('style') || '').toContain('--assistly-brass');
    expect(root.getAttribute('style') || '').toContain('#cc0000');
  });

  it('does not throw without primaryColor (optional prop)', async () => {
    await act(async () => {
      render(<AssistlyChat chatbotId={1} origin="https://example.com" />);
    });
  });
});
