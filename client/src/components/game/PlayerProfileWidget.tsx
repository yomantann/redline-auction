import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { User, LogIn, LogOut } from "lucide-react";

export function PlayerProfileWidget() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-500 animate-pulse">
        <div className="w-5 h-5 rounded-full bg-white/10" />
        <div className="w-16 h-2 rounded bg-white/10" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <a
        href="/api/login"
        className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Log in to save your progress"
      >
        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
          <User size={10} className="text-zinc-400" />
        </div>
        <span className="font-mono tracking-widest">GUEST</span>
        <LogIn size={11} className="text-zinc-500" />
      </a>
    );
  }

  const displayName = user.firstName || user.email?.split("@")[0] || "Player";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded text-xs">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={displayName}
            className="w-5 h-5 rounded-full object-cover border border-primary/30"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center">
            <User size={10} className="text-primary" />
          </div>
        )}
        <span className="font-mono tracking-widest text-primary">{displayName.toUpperCase()}</span>
      </div>
      <a
        href="/api/logout"
        className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors"
        title="Log out"
      >
        <LogOut size={13} />
      </a>
    </div>
  );
}
