import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap, Target, Skull, Crown, History, ArrowLeft, TrendingUp, RefreshCw, Coins } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { PlayerProfile } from "@shared/schema";

// Human-readable labels for winsPerMode keys (e.g. sp_haunted → SP Haunted)
function formatModeKey(key: string): string {
  return key
    .replace('sp_', 'SP ')
    .replace('mp_', 'MP ')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Stats() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setLoading(false); return; }
    fetch('/api/player/profile', { credentials: 'include' })
      .then((r) => {
        if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return null;
        return r.json();
      })
      .then((d) => { if (d?.success) setProfile(d.profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated]);

  const totalWins = profile ? Object.values(profile.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0) : 0;
  const winRate = profile && profile.totalGames > 0
    ? `${((totalWins / profile.totalGames) * 100).toFixed(1)}%`
    : '—';
  const winsPerMode = profile ? (profile.winsPerMode as Record<string, number>) : {};
  const modeEntries = Object.entries(winsPerMode).filter(([, v]) => v > 0);
  const gamesPerMode = profile ? (profile.gamesPerMode as Record<string, number>) : {};
  // Merge keys from both wins and games so every mode with any activity shows up
  const allModeKeys = Array.from(new Set([...Object.keys(winsPerMode), ...Object.keys(gamesPerMode)])).filter(k => (winsPerMode[k] ?? 0) > 0 || (gamesPerMode[k] ?? 0) > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/game">
                    <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                        DRIVER STATISTICS
                    </h1>
                    <p className="text-muted-foreground">Career Performance Record</p>
                </div>
            </div>
            {loading && <RefreshCw size={18} className="animate-spin text-zinc-500" />}
        </div>

        {/* Guest / loading notice */}
        {!authLoading && !isAuthenticated && (
          <div className="text-center py-6 text-zinc-500 text-sm">
            <a href="/api/login" className="underline text-primary hover:text-primary/80">Log in</a> to track your real career stats.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Key Stats */}
            <Card className="bg-zinc-900/50 border-white/10 col-span-1 md:col-span-3 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <Trophy size={16} className="text-yellow-500"/> VICTORIES
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-5xl font-display font-bold text-white mb-2">
                      {profile ? totalWins : '—'}
                    </div>
                    <div className="text-sm text-zinc-500">
                        Win Rate: <span className="text-green-400">{winRate}</span>
                    </div>
                    {profile && (
                      <div className="text-xs text-zinc-600 mt-1">
                        {profile.totalGames} game{profile.totalGames !== 1 ? 's' : ''} played
                      </div>
                    )}
                </CardContent>
            </Card>

             <Card className="bg-zinc-900/50 border-white/10 col-span-1 md:col-span-3 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <TrendingUp size={16} className="text-blue-500"/> PERFORMANCE METRICS
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {profile ? profile.totalGames : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase">Games Played</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {profile ? profile.convertedTrophies : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase">Trophies Earned</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {profile ? profile.convertedMomentFlags : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase">Moment Flags</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">
                          {profile ? profile.lifetimeEarned.toLocaleString() : '—'}
                        </div>
                        <div className="text-xs text-zinc-500 uppercase flex items-center gap-1">
                          <Coins size={10} /> Credits Earned
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wins per mode */}
             <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <Crown size={16} className="text-purple-500"/> MODE BREAKDOWN
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allModeKeys.length > 0 ? (
                    allModeKeys.map((key) => {
                      const wins = winsPerMode[key] ?? 0;
                      const played = gamesPerMode[key] ?? 0;
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-zinc-300 capitalize">{formatModeKey(key)}</span>
                          <span className="font-mono text-xs text-zinc-400">
                            {played > 0 && <span className="text-zinc-500">{played}G&nbsp;</span>}
                            <span className="text-yellow-400 font-bold">{wins}W</span>
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-zinc-600 italic">
                      {profile ? 'No games recorded yet.' : 'Log in to see stats by mode.'}
                    </div>
                  )}
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <Skull size={16} className="text-orange-500"/> ECONOMY
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Credits Balance</span>
                        <span className="font-mono text-primary">
                          {profile ? profile.currencyBalance.toLocaleString() : '—'}
                        </span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Lifetime Spent</span>
                        <span className="font-mono text-orange-400">
                          {profile ? profile.lifetimeSpent.toLocaleString() : '—'}
                        </span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Cosmetics Owned</span>
                        <span className="font-mono text-blue-400">
                          {profile ? (profile.ownedCosmetics as string[]).length : '—'}
                        </span>
                     </div>
                </CardContent>
            </Card>

             <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <History size={16} className="text-zinc-500"/> QUICK LINKS
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/profile">
                    <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                      <Target size={13} className="mr-2" /> Profile &amp; Shop
                    </Button>
                  </Link>
                  <Link href="/game">
                    <Button variant="outline" size="sm" className="w-full border-white/10 text-zinc-300 hover:bg-white/5">
                      <Zap size={13} className="mr-2" /> Play Now
                    </Button>
                  </Link>
                </CardContent>
            </Card>

            {/* CTA */}
             <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 flex items-center justify-center p-6 col-span-1 md:col-span-2">
                 <div className="text-center">
                    <Zap size={32} className="mx-auto text-primary mb-2 animate-pulse" />
                    <div className="font-display font-bold text-xl text-white">READY FOR MORE?</div>
                    <Link href="/game">
                        <Button className="mt-4 w-full" variant="secondary">PLAY NOW</Button>
                    </Link>
                 </div>
            </Card>

        </div>
      </div>
    </div>
  );
}
