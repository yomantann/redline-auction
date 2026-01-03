import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Clock, Zap, Target, Skull, Crown, History, ArrowLeft, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Stats() {
  // Mock Data for Prototype
  const stats = {
    gamesPlayed: 142,
    wins: 58,
    winRate: "40.8%",
    tokensCollected: 312,
    totalTimeBid: "420m 15s",
    avgBidAccuracy: "94%",
    favoriteDriver: "Alpha Prime",
    nemesis: "The Accuser",
    abilitiesUsed: 89,
    socialDaresCompleted: 24,
    drinksConsumed: 18, // Bio-fuel stat
  };

  const recentHistory = [
    { result: "WIN", tokens: 5, time: "4:30", mode: "STANDARD", date: "2m ago" },
    { result: "LOSE", tokens: 2, time: "0:00", mode: "SOCIAL OVERDRIVE", date: "15m ago" },
    { result: "WIN", tokens: 4, time: "1:12", mode: "BIO-FUEL", date: "45m ago" },
    { result: "LOSE", tokens: 3, time: "0:05", mode: "STANDARD", date: "1h ago" },
    { result: "WIN", tokens: 6, time: "3:45", mode: "COMPETITIVE", date: "2h ago" },
  ];

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
            <div className="text-right">
                <div className="text-2xl font-mono font-bold text-white">LEVEL 12</div>
                <div className="text-xs text-primary tracking-widest uppercase">Elite Broker</div>
            </div>
        </div>

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
                    <div className="text-5xl font-display font-bold text-white mb-2">{stats.wins}</div>
                    <div className="text-sm text-zinc-500">
                        Win Rate: <span className="text-green-400">{stats.winRate}</span>
                    </div>
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
                        <div className="text-2xl font-bold text-white">{stats.gamesPlayed}</div>
                        <div className="text-xs text-zinc-500 uppercase">Games Played</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">{stats.tokensCollected}</div>
                        <div className="text-xs text-zinc-500 uppercase">Tokens Earned</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">{stats.abilitiesUsed}</div>
                        <div className="text-xs text-zinc-500 uppercase">Abilities Used</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl font-bold text-white">{stats.avgBidAccuracy}</div>
                        <div className="text-xs text-zinc-500 uppercase">Bid Accuracy</div>
                    </div>
                </CardContent>
            </Card>

            {/* Specialized Stats */}
             <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <Crown size={16} className="text-purple-500"/> FAVORITES
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-xs text-zinc-500 mb-1">Most Played Driver</div>
                        <div className="text-lg font-bold text-white">{stats.favoriteDriver}</div>
                    </div>
                    <Separator className="bg-white/5" />
                    <div>
                        <div className="text-xs text-zinc-500 mb-1">Bitter Rival</div>
                        <div className="text-lg font-bold text-red-400">{stats.nemesis}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <Skull size={16} className="text-orange-500"/> VARIANT STATS
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Social Dares</span>
                        <span className="font-mono text-purple-400">{stats.socialDaresCompleted}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Bio-Fuel Drinks</span>
                        <span className="font-mono text-orange-400">{stats.drinksConsumed}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">Total Bidding Time</span>
                        <span className="font-mono text-blue-400">{stats.totalTimeBid}</span>
                     </div>
                </CardContent>
            </Card>

             <Card className="bg-zinc-900/50 border-white/10 row-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
                        <History size={16} className="text-zinc-500"/> RECENT HISTORY
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                    {recentHistory.map((game, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${game.result === 'WIN' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                                <div>
                                    <div className="font-bold text-sm text-white">{game.result}</div>
                                    <div className="text-[10px] text-zinc-500">{game.mode}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono text-sm text-primary">{game.tokens} Tokens</div>
                                <div className="text-[10px] text-zinc-500">{game.date}</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            
            {/* Filler for Grid Balance */}
             <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 flex items-center justify-center p-6">
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
