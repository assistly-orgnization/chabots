"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  disabled?: boolean;
};

export default function InviteAdminForm({ disabled }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin-users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to send invite");
        return;
      }
      setSuccess(`Invitation sent to ${email.trim().toLowerCase()}`);
      setEmail("");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 md:flex-row md:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="invite-email"
          className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1"
        >
          Email
        </label>
        <Input
          id="invite-email"
          type="email"
          required
          placeholder="person@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={disabled || submitting}
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={disabled || submitting || !email.trim()}>
        {submitting ? "Sending…" : "Invite"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 md:basis-full" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 md:basis-full" role="status">
          {success}
        </p>
      )}
    </form>
  );
}