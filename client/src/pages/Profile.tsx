import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Coins,
  ShoppingBag,
  Package,
  Sparkles,
  Trophy,
  Flag,
  CheckCircle2,
  Lock,
  RefreshCw,
  User,
  Target,
} from "lucide-react";
import type {
  PlayerProfile,
  CosmeticItem,
  CosmeticType,
  CosmeticRarity,
} from "@shared/schema";

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Credit pack offerings.
 * STRIPE_HOOK: Map each pack to a Stripe Price ID (e.g. price_xxx) when Stripe is live.
 */
const CREDIT_PACKS: { amount: number; label: string; price: string }[] = [
  { amount: 500,  label: "500 Credits",  price: "$0.99" },
  { amount: 1200, label: "1,200 Credits", price: "$1.99" },
  { amount: 3000, label: "3,000 Credits", price: "$3.99" },
  { amount: 7500, label: "7,500 Credits", price: "$8.99" },
];

const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: "text-zinc-300 border-zinc-500/30",
  rare: "text-blue-300 border-blue-500/30",
  legendary: "text-yellow-300 border-yellow-500/30",
};

const RARITY_BG: Record<CosmeticRarity, string> = {
  common: "bg-zinc-800/50",
  rare: "bg-blue-950/40",
  legendary: "bg-yellow-950/30",
};

const TYPE_LABELS: Record<CosmeticType, string> = {
  logo: "Logo",
  border: "Border",
  background: "Background",
  driverSkin: "Driver Skin",
};

const TYPE_ICONS: Record<CosmeticType, React.ReactNode> = {
  logo: <span className="text-sm">🎯</span>,
  border: <span className="text-sm">🖼️</span>,
  background: <span className="text-sm">🌌</span>,
  driverSkin: <span className="text-sm">🏎️</span>,
};

// ─── Milestone Display Definitions ─────────────────────────────────────────────
// Mirrors the server-side MILESTONE_DEFINITIONS in currencyEngine.ts.
// These are static and safe to keep on the client (no sensitive logic).

interface MilestoneDisplay {
  id: string;
  cosmeticId: string;
  label: string;
  reward: string;
  goal: number;
  getProgress: (profile: PlayerProfile) => number;
}

const MILESTONES_DISPLAY: MilestoneDisplay[] = [
  {
    id: 'milestone_10_wins',
    cosmeticId: 'logo_apex',
    label: 'Win 10 total games across any mode',
    reward: 'Apex Legend logo',
    goal: 10,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_5_haunted_wins',
    cosmeticId: 'border_haunted',
    label: 'Win 5 Haunted mode games (SP or MP)',
    reward: 'Haunted Glow border',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0);
    },
  },
];

// ─── API helpers ───────────────────────────────────────────────────────────────

async function fetchProfile(): Promise<PlayerProfile | null> {
  const res = await fetch('/api/player/profile', { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.success ? (data.profile as PlayerProfile) : null;
}

async function fetchCosmetics(): Promise<CosmeticItem[]> {
  const res = await fetch("/api/cosmetics");
  if (!res.ok) throw new Error("Failed to fetch cosmetics");
  const data = await res.json();
  return data.cosmetics as CosmeticItem[];
}

async function apiPurchase(cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch('/api/player/purchase', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Purchase failed");
  return data.profile as PlayerProfile;
}

async function apiEquip(cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch('/api/player/equip', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Equip failed");
  return data.profile as PlayerProfile;
}

async function apiUnequip(cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch('/api/player/unequip', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Unequip failed");
  return data.profile as PlayerProfile;
}

/**
 * STRIPE_HOOK: When Stripe is integrated, this function receives the
 * clientSecret from the server and opens the Stripe payment sheet.
 * Currently returns a placeholder response.
 */
async function apiPurchaseCurrency(
  amount: number,
  label: string,
): Promise<{ clientSecret: string | null; message: string }> {
  const res = await fetch('/api/player/purchase-currency', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',
    body: JSON.stringify({
      amount,
      purchasedItemType: 'credits_pack',
      purchasedItemLabel: label,
    }),
  });
  const data = await res.json();
  if (!data.success && !data.skipped) throw new Error(data.error ?? "Purchase currency failed");
  return { clientSecret: data.clientSecret ?? null, message: data.message ?? 'Coming soon.' };
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function CosmeticCard({
  item,
  isOwned,
  isEquipped,
  canAfford,
  onPurchase,
  onEquip,
  onUnequip,
}: {
  item: CosmeticItem;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-3 relative transition-all ${
        RARITY_BG[item.rarity]
      } ${RARITY_COLORS[item.rarity]} ${
        isEquipped ? "ring-2 ring-primary/60" : ""
      }`}
    >
      {/* Rarity badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest opacity-70">
          {item.rarity}
        </span>
        {isEquipped && (
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1">
            <CheckCircle2 size={10} /> EQUIPPED
          </span>
        )}
        {item.earnableOnly && !isOwned && (
          <span className="text-[10px] uppercase tracking-widest text-amber-400/80 flex items-center gap-1">
            <Trophy size={10} /> EARNABLE
          </span>
        )}
      </div>

      {/* Icon / asset preview */}
      <div className="flex items-center justify-center h-16">
        {item.asset && item.asset.startsWith("/") ? (
          <img
            src={item.asset}
            alt={item.name}
            className="h-14 w-14 object-contain rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="text-4xl opacity-60">{TYPE_ICONS[item.type]}</div>
        )}
      </div>

      {/* Name */}
      <div className="text-sm font-bold text-center">{item.name}</div>

      {/* Cost */}
      <div className="flex items-center justify-center gap-1 text-xs opacity-70">
        {item.cost === 0 ? (
          <span className="text-green-400">Free</span>
        ) : (
          <>
            <Coins size={12} />
            <span>{item.cost.toLocaleString()} credits</span>
          </>
        )}
      </div>

      {/* Action button */}
      {isOwned ? (
        isEquipped ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-zinc-600"
            onClick={() => onUnequip(item.id)}
          >
            Unequip
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() => onEquip(item.id)}
          >
            Equip
          </Button>
        )
      ) : item.earnableOnly ? (
        <Button size="sm" variant="ghost" disabled className="text-xs opacity-50">
          <Lock size={12} className="mr-1" /> Earn only
        </Button>
      ) : (
        <Button
          size="sm"
          variant={canAfford ? "default" : "ghost"}
          disabled={!canAfford}
          className="text-xs"
          onClick={() => onPurchase(item.id)}
        >
          {canAfford ? (
            <>
              <ShoppingBag size={12} className="mr-1" /> Purchase
            </>
          ) : (
            <>
              <Lock size={12} className="mr-1" /> Not enough credits
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function EquippedPreview({
  profile,
  cosmetics,
}: {
  profile: PlayerProfile;
  cosmetics: CosmeticItem[];
}) {
  const slots: Array<{ key: string; label: string }> = [
    { key: "logo", label: "Logo" },
    { key: "border", label: "Border" },
    { key: "background", label: "Background" },
    { key: "driverSkin", label: "Driver Skin" },
  ];
  const equipped = profile.equippedCosmetics as Record<string, string>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {slots.map(({ key, label }) => {
        const id = equipped[key];
        const item = id ? cosmetics.find((c) => c.id === id) : undefined;
        return (
          <div
            key={key}
            className="bg-zinc-900/60 border border-white/10 rounded-lg p-3 flex flex-col items-center gap-2"
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              {label}
            </div>
            {item ? (
              <>
                <div className="text-3xl opacity-80">{TYPE_ICONS[item.type]}</div>
                <div className={`text-xs font-semibold text-center ${RARITY_COLORS[item.rarity]}`}>
                  {item.name}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl opacity-20">—</div>
                <div className="text-xs text-zinc-600">None</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Profile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<CosmeticType | "all">("all");
  const { toast } = useToast();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchProfile(), fetchCosmetics()]);
      setProfile(p);
      setCosmetics(c);
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, authUser?.id, load]);

  const handlePurchase = async (cosmeticId: string) => {
    try {
      const updated = await apiPurchase(cosmeticId);
      setProfile(updated);
      const item = cosmetics.find((c) => c.id === cosmeticId);
      toast({
        title: "Purchase successful!",
        description: `You unlocked ${item?.name ?? cosmeticId}.`,
      });
    } catch (err) {
      toast({ title: "Purchase failed", description: String(err), variant: "destructive" });
    }
  };

  const handleEquip = async (cosmeticId: string) => {
    try {
      const updated = await apiEquip(cosmeticId);
      setProfile(updated);
    } catch (err) {
      toast({ title: "Equip failed", description: String(err), variant: "destructive" });
    }
  };

  const handleUnequip = async (cosmeticId: string) => {
    try {
      const updated = await apiUnequip(cosmeticId);
      setProfile(updated);
    } catch (err) {
      toast({ title: "Unequip failed", description: String(err), variant: "destructive" });
    }
  };

  /**
   * STRIPE_HOOK: When Stripe is integrated, this handler will receive the
   * clientSecret from the server and open the Stripe payment sheet.
   * For now it just shows the "coming soon" message from the server.
   */
  const handleBuyCredits = async (amount: number, label: string) => {
    try {
      const result = await apiPurchaseCurrency(amount, label);
      toast({
        title: result.clientSecret ? "Payment initiated" : "Coming Soon",
        description: result.message,
        // STRIPE_HOOK: when clientSecret is non-null, open Stripe.js payment sheet here
      });
    } catch (err) {
      toast({ title: "Purchase failed", description: String(err), variant: "destructive" });
    }
  };

  const filteredCosmetics = cosmetics.filter(
    (c) => filterType === "all" || c.type === filterType,
  );

  const ownedCosmetics = profile
    ? cosmetics.filter((c) => (profile.ownedCosmetics as string[]).includes(c.id))
    : [];

  const filteredOwned = ownedCosmetics.filter(
    (c) => filterType === "all" || c.type === filterType,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Show login gate for guests
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="text-zinc-400 text-sm">Log in to view your profile, wallet, and cosmetics.</div>
        <a
          href="/api/login"
          className="px-4 py-2 bg-primary text-black font-semibold rounded text-sm hover:bg-primary/80 transition-colors"
        >
          Log in with Replit
        </a>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-zinc-400">Could not load profile.</p>
          <Button onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  const typeFilters: Array<{ value: CosmeticType | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "logo", label: "Logos" },
    { value: "border", label: "Borders" },
    { value: "background", label: "Backgrounds" },
    { value: "driverSkin", label: "Skins" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/game">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/10 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            {/* Profile avatar from Replit Auth */}
            {(profile.profileImageUrl ?? authUser?.profileImageUrl) ? (
              <img
                src={profile.profileImageUrl ?? authUser?.profileImageUrl ?? ''}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/40 shadow-lg shadow-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                <User size={20} className="text-primary/70" />
              </div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                DRIVER PROFILE
              </h1>
              <p className="text-zinc-500 text-sm">{profile.username ?? authUser?.firstName ?? 'Driver'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={load}
            title="Refresh"
            className="text-zinc-500 hover:text-white"
          >
            <RefreshCw size={16} />
          </Button>
        </div>

        {/* ── Wallet Card ── */}
        <Card className="bg-gradient-to-r from-primary/20 to-purple-900/20 border-primary/30">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Balance */}
            <div className="flex-1 text-center sm:text-left">
              <div className="text-xs uppercase tracking-widest text-zinc-400 mb-1 flex items-center justify-center sm:justify-start gap-1">
                <Coins size={12} /> Credits Balance
              </div>
              <div className="text-4xl font-display font-bold text-primary">
                {profile.currencyBalance.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Lifetime earned: {profile.lifetimeEarned.toLocaleString()} &nbsp;·&nbsp;
                Spent: {profile.lifetimeSpent.toLocaleString()}
              </div>
              {/* Wins per mode summary */}
              {profile.winsPerMode && Object.keys(profile.winsPerMode).length > 0 && (
                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-2">
                  {Object.entries(profile.winsPerMode).map(([k, v]) => (
                    v > 0 ? (
                      <span key={k} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-300 capitalize">
                        {k.replace('_', ' ').replace('sp', 'SP').replace('mp', 'MP')}: {v}W
                      </span>
                    ) : null
                  ))}
                </div>
              )}
            </div>

            {/* Conversion info */}
            <div className="flex gap-6 text-center">
              <div className="bg-yellow-950/40 border border-yellow-500/20 rounded-lg px-4 py-3">
                <Trophy size={20} className="mx-auto text-yellow-400 mb-1" />
                <div className="text-xs text-zinc-400">Trophy</div>
                <div className="text-sm font-bold text-yellow-300">= 100 credits</div>
              </div>
              <div className="bg-purple-950/40 border border-purple-500/20 rounded-lg px-4 py-3">
                <Flag size={20} className="mx-auto text-purple-400 mb-1" />
                <div className="text-xs text-zinc-400">Moment Flag</div>
                <div className="text-sm font-bold text-purple-300">= 25 credits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Equipped Cosmetics Preview ── */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
              <Sparkles size={16} className="text-primary" /> CURRENTLY EQUIPPED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EquippedPreview profile={profile} cosmetics={cosmetics} />
          </CardContent>
        </Card>

        {/* ── Milestones ── */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
              <Target size={16} className="text-yellow-500" /> MILESTONES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MILESTONES_DISPLAY.map((m) => {
              const progress = m.getProgress(profile);
              const pct = Math.min(100, Math.round((progress / m.goal) * 100));
              const unlocked = (profile.milestoneUnlocks as string[]).includes(m.id) ||
                               (profile.ownedCosmetics as string[]).includes(m.cosmeticId);
              return (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${unlocked ? 'text-yellow-400' : 'text-zinc-300'}`}>
                      {unlocked && <CheckCircle2 size={11} className="inline mr-1 text-yellow-400" />}
                      {m.label}
                    </span>
                    <span className={`font-mono ${unlocked ? 'text-yellow-400' : 'text-zinc-500'}`}>
                      {unlocked ? 'UNLOCKED' : `${Math.min(progress, m.goal)} / ${m.goal}`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${unlocked ? 'bg-yellow-400' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Trophy size={9} /> Reward: {m.reward}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── Type Filter ── */}
        <div className="flex flex-wrap gap-2">
          {typeFilters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                filterType === value
                  ? "bg-primary text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tabs: Shop / Inventory ── */}
        <Tabs defaultValue="shop" className="w-full">
          <TabsList className="w-full bg-zinc-900 border border-white/10 mb-4">
            <TabsTrigger
              value="shop"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <ShoppingBag size={14} className="mr-2" /> Shop
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <Package size={14} className="mr-2" /> Inventory
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {(profile.ownedCosmetics as string[]).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── Shop Tab ── */}
          <TabsContent value="shop">
            {filteredCosmetics.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">No items in this category.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredCosmetics.map((item) => (
                  <CosmeticCard
                    key={item.id}
                    item={item}
                    isOwned={(profile.ownedCosmetics as string[]).includes(item.id)}
                    isEquipped={Object.values(profile.equippedCosmetics as Record<string, string>).includes(item.id)}
                    canAfford={profile.currencyBalance >= item.cost}
                    onPurchase={handlePurchase}
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Inventory Tab ── */}
          <TabsContent value="inventory">
            {filteredOwned.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">
                You don't own any {filterType === "all" ? "" : TYPE_LABELS[filterType as CosmeticType] + " "}
                items yet. Head to the shop!
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredOwned.map((item) => (
                  <CosmeticCard
                    key={item.id}
                    item={item}
                    isOwned
                    isEquipped={Object.values(profile.equippedCosmetics as Record<string, string>).includes(item.id)}
                    canAfford={profile.currencyBalance >= item.cost}
                    onPurchase={handlePurchase}
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Buy Credits (Stripe placeholder) ── */}
        <Card className="bg-zinc-900/30 border-dashed border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-zinc-300">Buy Credits</div>
                {/* STRIPE_HOOK: Remove "coming soon" label and replace button with Stripe Elements */}
                <div className="text-xs text-zinc-500">Stripe integration coming soon</div>
              </div>
            </div>
            {/* Credit packs – STRIPE_HOOK: map each pack to a Stripe Price ID */}
            <div className="flex flex-wrap gap-2">
              {CREDIT_PACKS.map((pack) => (
                <Button
                  key={pack.amount}
                  variant="outline"
                  size="sm"
                  className="opacity-50 cursor-not-allowed text-xs"
                  disabled
                  onClick={() => handleBuyCredits(pack.amount, pack.label)}
                  title="Stripe integration coming soon"
                >
                  <Coins size={12} className="mr-1" />
                  {pack.label} — {pack.price}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
