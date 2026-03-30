import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Coins,
  ShoppingBag,
  Package,
  Sparkles,
  Trophy,
  Flag,
  Star,
  CheckCircle2,
  Lock,
  RefreshCw,
} from "lucide-react";
import type {
  PlayerProfile,
  CosmeticItem,
  CosmeticType,
  CosmeticRarity,
} from "@shared/schema";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEMO_USER_ID = "local_player";

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

// ─── API helpers ───────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<PlayerProfile> {
  const res = await fetch(`/api/player/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  const data = await res.json();
  return data.profile as PlayerProfile;
}

async function fetchCosmetics(): Promise<CosmeticItem[]> {
  const res = await fetch("/api/cosmetics");
  if (!res.ok) throw new Error("Failed to fetch cosmetics");
  const data = await res.json();
  return data.cosmetics as CosmeticItem[];
}

async function apiPurchase(userId: string, cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch(`/api/player/${userId}/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Purchase failed");
  return data.profile as PlayerProfile;
}

async function apiEquip(userId: string, cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch(`/api/player/${userId}/equip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Equip failed");
  return data.profile as PlayerProfile;
}

async function apiUnequip(userId: string, cosmeticId: string): Promise<PlayerProfile> {
  const res = await fetch(`/api/player/${userId}/unequip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cosmeticId }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Unequip failed");
  return data.profile as PlayerProfile;
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
  const slots: Array<{ key: keyof typeof profile.equippedCosmetics; label: string }> = [
    { key: "logo", label: "Logo" },
    { key: "border", label: "Border" },
    { key: "background", label: "Background" },
    { key: "driverSkin", label: "Driver Skin" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {slots.map(({ key, label }) => {
        const id = profile.equippedCosmetics[key];
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

  const userId = DEMO_USER_ID;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchProfile(userId), fetchCosmetics()]);
      setProfile(p);
      setCosmetics(c);
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePurchase = async (cosmeticId: string) => {
    try {
      const updated = await apiPurchase(userId, cosmeticId);
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
      const updated = await apiEquip(userId, cosmeticId);
      setProfile(updated);
    } catch (err) {
      toast({ title: "Equip failed", description: String(err), variant: "destructive" });
    }
  };

  const handleUnequip = async (cosmeticId: string) => {
    try {
      const updated = await apiUnequip(userId, cosmeticId);
      setProfile(updated);
    } catch (err) {
      toast({ title: "Unequip failed", description: String(err), variant: "destructive" });
    }
  };

  const filteredCosmetics = cosmetics.filter(
    (c) => filterType === "all" || c.type === filterType,
  );

  const ownedCosmetics = profile
    ? cosmetics.filter((c) => profile.ownedCosmetics.includes(c.id))
    : [];

  const filteredOwned = ownedCosmetics.filter(
    (c) => filterType === "all" || c.type === filterType,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <RefreshCw className="animate-spin text-primary" size={32} />
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
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                DRIVER PROFILE
              </h1>
              <p className="text-zinc-500 text-sm">{profile.username}</p>
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
                {profile.ownedCosmetics.length}
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
                    isOwned={profile.ownedCosmetics.includes(item.id)}
                    isEquipped={Object.values(profile.equippedCosmetics).includes(item.id)}
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
                    isEquipped={Object.values(profile.equippedCosmetics).includes(item.id)}
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

        {/* ── Stripe Coming Soon ── */}
        <Card className="bg-zinc-900/30 border-dashed border-white/10">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-zinc-300">Buy Credits</div>
              <div className="text-xs text-zinc-500">Stripe integration coming soon</div>
            </div>
            <Button variant="outline" disabled className="opacity-40 cursor-not-allowed">
              <Star size={14} className="mr-2" /> Coming Soon
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
