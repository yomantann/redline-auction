import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Shield, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export function GuestBanner() {
  const { isAuthenticated, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  if (isLoading || isAuthenticated || dismissed) return null;

  const loginHref = `/api/login?returnTo=${encodeURIComponent(location)}`;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-yellow-950/40 border border-yellow-500/20 rounded-lg text-xs text-yellow-200/80 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <Shield size={13} className="text-yellow-500 shrink-0" />
        <span>
          Playing as guest — stats, credits, and cosmetics won&apos;t be saved.{" "}
          <a href={loginHref} className="text-yellow-400 underline underline-offset-2 hover:text-yellow-300 transition-colors font-semibold">
            Log in with Replit
          </a>{" "}
          to keep your progress.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-yellow-600 hover:text-yellow-400 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
