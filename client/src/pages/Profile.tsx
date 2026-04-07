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
  X,
  Clock,
  BarChart2,
  Swords,
  Zap,
  Eye,
  ChevronDown,
} from "lucide-react";
import type {
  PlayerProfile,
  CosmeticItem,
  CosmeticType,
  CosmeticRarity,
} from "@shared/schema";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { SKIN_ASSET_URLS, CARD_BACKGROUND_URLS, CARD_BORDER_URLS, LOGO_ASSET_URLS } from "@/lib/skinAssets";
import { cn } from "@/lib/utils";
import bgStandard1 from "@/assets/generated_images/BG/bg_standard_redline.png";

let _stripePublishableKey: string | null = null;
const stripePromise = fetch('/api/config')
  .then((r) => r.json())
  .then((cfg) => {
    _stripePublishableKey = cfg.stripePublishableKey;
    return _stripePublishableKey ? loadStripe(_stripePublishableKey) : null;
  })
  .catch(() => null);

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Credit pack offerings.
 * STRIPE_HOOK: Map each pack to a Stripe Price ID (e.g. price_xxx) when Stripe is live.
 */
const CREDIT_PACKS: { amount: number; label: string; price: string }[] = [
  { amount: 25000,  label: "25,000 Credits",  price: "$1.00" },
  { amount: 125000, label: "125,000 Credits", price: "$5.00" },
  { amount: 250000, label: "250,000 Credits", price: "$10.00" },
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

/** Returns remaining time string for a limited-time item, or null if expired. */
function getLimitedTimeLabel(endsAt?: string): string | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours > 0) return `${hours}h left`;
  return "< 1h left";
}

/** Returns true if a limited-time item is still available. */
function isLimitedTimeActive(item: CosmeticItem): boolean {
  if (!item.limitedTime) return false;
  if (!item.endsAt) return true;
  return new Date(item.endsAt).getTime() > Date.now();
}

/** Human-readable name for each driver ID. Used to display skin requirements on cards. */
const DRIVER_DISPLAY_NAMES: Record<string, string> = {
  accuser:       'The Accuser',
  alpha_prime:   'Alpha Prime',
  anointed:      'The Anointed',
  click_click:   'Click-Click',
  rainbow_dash:  'Rainbow Dash',
  frostbyte:     'Frostbyte',
  guardian_h:    'Guardian H',
  hotwired:      'Hotwired',
  low_flame:     'Low Flame',
  pain_hider:    'Pain Hider',
  panic_bot:     'Panic Bot',
  the_rind:      'The Rind',
  roll_safe:     'Roll Safe',
  sadman:        'Sadman Logic',
  wandering_eye: 'Wandering Eye',
  executive_p:   'Executive P',
  primate:       'Primate Prime',
};

// ─── Milestone Display Definitions ─────────────────────────────────────────────
// Mirrors the server-side MILESTONE_DEFINITIONS in currencyEngine.ts.
// These are static and safe to keep on the client (no sensitive logic).

interface MilestoneDisplay {
  id: string;
  cosmeticId?: string;
  creditReward?: number;
  label: string;
  reward: string;
  goal: number;
  getProgress: (profile: PlayerProfile) => number;
}

const MILESTONES_DISPLAY: MilestoneDisplay[] = [
  // ── Cosmetic milestones ────────────────────────────────────────────────────
  {
    id: 'milestone_10_wins',
    cosmeticId: 'border_molten',
    label: 'Win 10 total games across any mode',
    reward: 'Molten border',
    goal: 10,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_5_haunted_wins',
    cosmeticId: 'abyssal_depth_b',
    label: 'Win 5 Haunted mode games (SP or MP)',
    reward: 'Abyssal Depth background',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0);
    },
  },
  {
    id: 'milestone_collector_5',
    cosmeticId: 'logo_neon_red',
    label: 'Own 5 or more cosmetics',
    reward: 'Neon Red logo',
    goal: 5,
    getProgress: (p) => (p.ownedCosmetics as string[]).length,
  },
  // ── Credit reward milestones ───────────────────────────────────────────────
  {
    id: 'milestone_first_game',
    creditReward: 200,
    label: 'Play your first game',
    reward: '200 credits',
    goal: 1,
    getProgress: (p) => p.totalGames,
  },
  {
    id: 'milestone_10_games',
    creditReward: 1000,
    label: 'Play 10 total games',
    reward: '1,000 credits',
    goal: 10,
    getProgress: (p) => p.totalGames,
  },
  {
    id: 'milestone_50_games',
    creditReward: 10000,
    label: 'Play 50 total games',
    reward: '10,000 credits',
    goal: 50,
    getProgress: (p) => p.totalGames,
  },
  {
    id: 'milestone_100_games',
    creditReward: 20000,
    label: 'Play 100 total games',
    reward: '20,000 credits',
    goal: 100,
    getProgress: (p) => p.totalGames,
  },
  {
    id: 'milestone_first_win',
    creditReward: 500,
    label: 'Win your first game',
    reward: '500 credits',
    goal: 1,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_25_wins',
    creditReward: 5000,
    label: 'Win 25 total games across any mode',
    reward: '5,000 credits',
    goal: 25,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_50_wins',
    creditReward: 30000,
    label: 'Win 50 total games across any mode',
    reward: '30,000 credits',
    goal: 50,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_100_wins',
    creditReward: 50000,
    label: 'Win 100 total games across any mode',
    reward: '50,000 credits',
    goal: 100,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_500_wins',
    creditReward: 200000,
    label: 'Win 500 total games across any mode',
    reward: '200,000 credits',
    goal: 500,
    getProgress: (p) =>
      Object.values(p.winsPerMode as Record<string, number>).reduce((s, v) => s + (v ?? 0), 0),
  },
  {
    id: 'milestone_haunted_10_wins',
    cosmeticId: 'static_overload_b',
    label: 'Win 10 Haunted mode games (SP or MP)',
    reward: 'Static Overload background',
    goal: 10,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_haunted'] ?? 0) + (m['mp_haunted'] ?? 0);
    },
  },
  {
    id: 'milestone_sp_10_wins',
    creditReward: 2000,
    label: 'Win 10 Single Player games',
    reward: '2,000 credits',
    goal: 10,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_standard'] ?? 0) + (m['sp_social'] ?? 0) + (m['sp_bio'] ?? 0) + (m['sp_haunted'] ?? 0);
    },
  },
  {
    id: 'milestone_mp_5_wins',
    creditReward: 2000,
    label: 'Win 5 Multiplayer games',
    reward: '2,000 credits',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['mp_standard'] ?? 0) + (m['mp_social'] ?? 0) + (m['mp_bio'] ?? 0) + (m['mp_haunted'] ?? 0);
    },
  },
  {
    id: 'milestone_mp_25_wins',
    creditReward: 10000,
    label: 'Win 25 Multiplayer games',
    reward: '10,000 credits',
    goal: 25,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['mp_standard'] ?? 0) + (m['mp_social'] ?? 0) + (m['mp_bio'] ?? 0) + (m['mp_haunted'] ?? 0);
    },
  },
  {
    id: 'milestone_sprint_5_wins',
    creditReward: 1000,
    label: 'Win 5 Standard mode games (SP or MP)',
    reward: '1,000 credits',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_standard'] ?? 0) + (m['mp_standard'] ?? 0);
    },
  },
  {
    id: 'milestone_social_5_wins',
    creditReward: 1000,
    label: 'Win 5 Social Overdrive games',
    reward: '1,000 credits',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_social'] ?? 0) + (m['mp_social'] ?? 0);
    },
  },
  {
    id: 'milestone_bio_5_wins',
    creditReward: 1000,
    label: 'Win 5 Bio Fuel games',
    reward: '1,000 credits',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return (m['sp_bio'] ?? 0) + (m['mp_bio'] ?? 0);
    },
  },

  // ── Competitive Win Milestones ─────────────────────────────────────────────
  {
    id: 'milestone_competitive_first_win',
    creditReward: 1000,
    label: 'Win your first Competitive game',
    reward: '1,000 credits',
    goal: 1,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return m['comp'] ?? 0;
    },
  },
  {
    id: 'milestone_competitive_5_wins',
    creditReward: 3000,
    label: 'Win 5 Competitive games',
    reward: '3,000 credits',
    goal: 5,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return m['comp'] ?? 0;
    },
  },
  {
    id: 'milestone_competitive_25_wins',
    creditReward: 15000,
    label: 'Win 25 Competitive games',
    reward: '15,000 credits',
    goal: 25,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return m['comp'] ?? 0;
    },
  },
  {
    id: 'milestone_competitive_50_wins',
    creditReward: 40000,
    label: 'Win 50 Competitive games',
    reward: '40,000 credits',
    goal: 50,
    getProgress: (p) => {
      const m = p.winsPerMode as Record<string, number>;
      return m['comp'] ?? 0;
    },
  },
  {
    id: 'milestone_credits_5000',
    creditReward: 10000,
    label: 'Earn 5,000 lifetime credits',
    reward: '10,000 credits',
    goal: 5000,
    getProgress: (p) => p.lifetimeEarned,
  },
  {
    id: 'milestone_credits_1000000',
    creditReward: 250000,
    label: 'Earn 1,000,000 lifetime credits',
    reward: '250,000 credits',
    goal: 1000000,
    getProgress: (p) => p.lifetimeEarned,
  },
  {
    id: 'milestone_fashion_icon',
    creditReward: 1000,
    label: 'Own 10 or more cosmetics',
    reward: '1,000 credits',
    goal: 10,
    getProgress: (p) => (p.ownedCosmetics as string[]).length,
  },
  // ── Moment Flag milestones ──────────────────────────────────────────────────
  {
    id: 'milestone_flags_10',
    creditReward: 150,
    label: 'Earn 10 lifetime moment flags',
    reward: '150 credits',
    goal: 10,
    getProgress: (p) => (p.convertedMomentFlags ?? 0),
  },
  {
    id: 'milestone_flags_50',
    creditReward: 400,
    label: 'Earn 50 lifetime moment flags',
    reward: '400 credits',
    goal: 50,
    getProgress: (p) => (p.convertedMomentFlags ?? 0),
  },
  {
    id: 'milestone_flags_100',
    creditReward: 750,
    label: 'Earn 100 lifetime moment flags',
    reward: '750 credits',
    goal: 100,
    getProgress: (p) => (p.convertedMomentFlags ?? 0),
  },
  {
    id: 'milestone_flags_250',
    creditReward: 1500,
    label: 'Earn 250 lifetime moment flags',
    reward: '1,500 credits',
    goal: 250,
    getProgress: (p) => (p.convertedMomentFlags ?? 0),
  },

  // ── Specific Moment Flag Milestones ────────────────────────────────────────
  // Easter Egg (Hidden Flag) Milestones — descriptions intentionally vague
  {
    id: 'milestone_easter_egg_first',
    creditReward: 5000,
    label: 'Uncover your first hidden secret',
    reward: '5,000 credits',
    goal: 1,
    getProgress: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      const hidden = ['HIDDEN_67','HIDDEN_REDLINE_REVERSAL','HIDDEN_DEJA_BID','PATCH_NOTES_PENDING','HIDDEN_REDEMPTION','HIDDEN_NAIL_IN_THE_COFFIN'];
      return hidden.some(f => (perType[f] ?? 0) >= 1) ? 1 : 0;
    },
  },
  {
    id: 'milestone_easter_egg_two',
    creditReward: 25000,
    label: 'Uncover 4 different hidden secrets',
    reward: '25,000 credits',
    goal: 4,
    getProgress: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      const hidden = ['HIDDEN_67','HIDDEN_REDLINE_REVERSAL','HIDDEN_DEJA_BID','PATCH_NOTES_PENDING','HIDDEN_REDEMPTION','HIDDEN_NAIL_IN_THE_COFFIN'];
      return hidden.filter(f => (perType[f] ?? 0) >= 1).length;
    },
  },
  {
    id: 'milestone_easter_egg_all',
    creditReward: 200000,
    label: 'Uncover every hidden secret',
    reward: '200,000 credits',
    goal: 6,
    getProgress: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      const hidden = ['HIDDEN_67','HIDDEN_REDLINE_REVERSAL','HIDDEN_DEJA_BID','PATCH_NOTES_PENDING','HIDDEN_REDEMPTION','HIDDEN_NAIL_IN_THE_COFFIN'];
      return hidden.filter(f => (perType[f] ?? 0) >= 1).length;
    },
  },
  {
    id: 'milestone_hidden_67_3x',
    creditReward: 10000,
    label: 'Uncover a hidden numerical moment 3 times',
    reward: '10,000 credits',
    goal: 3,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['HIDDEN_67'] ?? 0,
  },
  {
    id: 'milestone_hidden_redemption_first',
    creditReward: 10000,
    label: 'Trigger a hidden comeback 3 times',
    reward: '10,000 credits',
    goal: 3,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['HIDDEN_REDEMPTION'] ?? 0,
  },
  {
    id: 'milestone_hidden_nail_3x',
    creditReward: 10000,
    label: 'Uncover a hidden finishing move 3 times',
    reward: '10,000 credits',
    goal: 3,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['HIDDEN_NAIL_IN_THE_COFFIN'] ?? 0,
  },
  {
    id: 'milestone_hidden_deja_bid',
    creditReward: 10000,
    label: 'Trigger a hidden repeating pattern 3 times',
    reward: '10,000 credits',
    goal: 3,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['HIDDEN_DEJA_BID'] ?? 0,
  },
  // Clutch / Skill Milestones
  {
    id: 'milestone_clutch_3x',
    creditReward: 500,
    label: 'Earn Clutch Play 6 times',
    reward: '500 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['CLUTCH_PLAY'] ?? 0,
  },
  {
    id: 'milestone_clutch_10x',
    creditReward: 2000,
    label: 'Earn Clutch Play 20 times',
    reward: '2,000 credits',
    goal: 20,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['CLUTCH_PLAY'] ?? 0,
  },
  {
    id: 'milestone_precision_5x',
    creditReward: 500,
    label: 'Earn Precision Strike 10 times',
    reward: '500 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['PRECISION_STRIKE'] ?? 0,
  },
  {
    id: 'milestone_overkill_3x',
    creditReward: 500,
    label: 'Earn Overkill 6 times',
    reward: '500 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['OVERKILL'] ?? 0,
  },
  {
    id: 'milestone_late_panic_5x',
    creditReward: 750,
    label: 'Earn Late Panic 10 times',
    reward: '750 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['LATE_PANIC'] ?? 0,
  },
  // Strategic Milestones
  {
    id: 'milestone_genius_5x',
    creditReward: 750,
    label: 'Earn Genius Move 10 times',
    reward: '750 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['GENIUS_MOVE'] ?? 0,
  },
  {
    id: 'milestone_fake_calm_5x',
    creditReward: 500,
    label: 'Earn Fake Calm 10 times',
    reward: '500 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['FAKE_CALM'] ?? 0,
  },
  {
    id: 'milestone_smug_3x',
    creditReward: 300,
    label: 'Earn Smug Confidence 6 times',
    reward: '300 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['SMUG_CONFIDENCE'] ?? 0,
  },
  // Domination Milestones
  {
    id: 'milestone_last_standing_3x',
    creditReward: 750,
    label: 'Be Last One Standing 6 times',
    reward: '750 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['LAST_ONE_STANDING'] ?? 0,
  },
  {
    id: 'milestone_last_standing_10x',
    creditReward: 3000,
    label: 'Be Last One Standing 20 times',
    reward: '3,000 credits',
    goal: 20,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['LAST_ONE_STANDING'] ?? 0,
  },
  // Comeback Milestones
  {
    id: 'milestone_comeback_5x',
    creditReward: 1000,
    label: 'Earn Comeback Hope 10 times',
    reward: '1,000 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['COMEBACK_HOPE'] ?? 0,
  },
  {
    id: 'milestone_comeback_10x',
    creditReward: 3000,
    label: 'Earn Comeback Hope 20 times',
    reward: '3,000 credits',
    goal: 20,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['COMEBACK_HOPE'] ?? 0,
  },
  // Sync / Pattern Milestones
  {
    id: 'milestone_deadlock_3x',
    creditReward: 500,
    label: 'Trigger Deadlock Sync 6 times',
    reward: '500 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['DEADLOCK_SYNC'] ?? 0,
  },
  {
    id: 'milestone_mirror_3x',
    creditReward: 500,
    label: 'Trigger Mirror Match 6 times',
    reward: '500 credits',
    goal: 6,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['MIRROR_MATCH'] ?? 0,
  },
  {
    id: 'milestone_deadlock_and_mirror',
    creditReward: 1000,
    label: 'Achieve both Deadlock Sync and Mirror Match',
    reward: '1,000 credits',
    goal: 2,
    getProgress: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      return [(perType['DEADLOCK_SYNC'] ?? 0) >= 1, (perType['MIRROR_MATCH'] ?? 0) >= 1].filter(Boolean).length;
    },
  },
  {
    id: 'milestone_easy_w_5x',
    creditReward: 500,
    label: 'Earn Easy W 10 times',
    reward: '500 credits',
    goal: 10,
    getProgress: (p) => ((p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {})['EASY_W'] ?? 0,
  },
  // Mastery Milestone
  {
    id: 'milestone_unique_10_flag_types',
    creditReward: 2500,
    label: 'Trigger 20 different unique moment flag types',
    reward: '2,500 credits',
    goal: 20,
    getProgress: (p) => {
      const perType = (p.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
      return Object.values(perType).filter(v => v >= 1).length;
    },
  },
];

// ─── Moment flag display labels ────────────────────────────────────────────────

const FLAG_LABELS: Record<string, string> = {
  CLUTCH_PLAY: 'Clutch Play', PRECISION_STRIKE: 'Precision Strike', OVERKILL: 'Overkill',
  GENIUS_MOVE: 'Genius Move', FAKE_CALM: 'Fake Calm', SMUG_CONFIDENCE: 'Smug Confidence', EASY_W: 'Easy W',
  COMEBACK_HOPE: 'Comeback Hope', LAST_ONE_STANDING: 'Last Standing', LATE_PANIC: 'Late Panic',
  ELIMINATED: 'Eliminated', AFK: 'AFK',
  DEADLOCK_SYNC: 'Deadlock Sync', MIRROR_MATCH: 'Mirror Match',
  HIDDEN_67: '???', HIDDEN_DEJA_BID: '???', HIDDEN_REDEMPTION: '???',
  HIDDEN_NAIL_IN_THE_COFFIN: '???', HIDDEN_REDLINE_REVERSAL: '???', PATCH_NOTES_PENDING: '???',
};

// ─── API helpers ───────────────────────────────────────────────────────────────

async function fetchProfile(): Promise<PlayerProfile | null> {
  const res = await fetch('/api/player/profile', { credentials: 'include' });
  if (!res.ok) return null;
  if (!res.headers.get('content-type')?.includes('application/json')) return null;
  const data = await res.json();
  // Server returns { skipped: true } when session is not yet established (e.g. right after
  // server restart while the client still has stale auth cache).  Signal null so the caller
  // can distinguish and retry.
  if (data?.skipped) return null;
  return data?.success && data.profile ? (data.profile as PlayerProfile) : null;
}

async function fetchCosmetics(): Promise<CosmeticItem[]> {
  const res = await fetch("/api/cosmetics");
  if (!res.ok) throw new Error("Failed to fetch cosmetics");
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error("Failed to fetch cosmetics (unexpected response)");
  }
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
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Purchase failed (${res.status})`);
  }
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
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Equip failed (${res.status})`);
  }
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
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Unequip failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? "Unequip failed");
  return data.profile as PlayerProfile;
}

async function apiCreatePaymentIntent(packKey: string): Promise<string> {
  const res = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ packKey }),
  });
  if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Could not reach the server. Please try again.');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Failed to create payment.');
  return data.clientSecret as string;
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
  onExpand,
}: {
  item: CosmeticItem;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
  onExpand?: (url: string, name: string) => void;
}) {
  const timeLabel = getLimitedTimeLabel(item.endsAt);
  const skinUrl = item.type === 'driverSkin' ? (SKIN_ASSET_URLS[item.asset] ?? SKIN_ASSET_URLS[item.id] ?? null) : null;
  const bgUrl = item.type === 'background' ? (CARD_BACKGROUND_URLS[item.asset] ?? CARD_BACKGROUND_URLS[item.id] ?? null) : null;
  const borderUrl = item.type === 'border' ? (CARD_BORDER_URLS[item.asset] ?? CARD_BORDER_URLS[item.id] ?? null) : null;
  const logoUrl = item.type === 'logo' ? (LOGO_ASSET_URLS[item.asset] ?? LOGO_ASSET_URLS[item.id] ?? (item.asset && item.asset.startsWith('/') ? item.asset : null)) : null;
  const previewUrl = skinUrl ?? bgUrl ?? borderUrl ?? logoUrl ?? (item.asset && item.asset.startsWith("/") ? item.asset : null);
  const hasExpandableImage = !!previewUrl;
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-3 relative transition-all ${
        RARITY_BG[item.rarity]
      } ${RARITY_COLORS[item.rarity]} ${
        isEquipped ? "ring-2 ring-primary/60" : ""
      } ${item.limitedTime ? "ring-1 ring-orange-500/40" : ""}`}
    >
      {/* Rarity + category row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest opacity-70">
          {item.rarity}
        </span>
        <span className="text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-1">
          {TYPE_ICONS[item.type]} {TYPE_LABELS[item.type]}
        </span>
      </div>

      {/* Status badges row */}
      <div className="flex items-center justify-between min-h-[16px]">
        {item.limitedTime && timeLabel && (
          <span className="text-[10px] uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1">
            <Clock size={10} /> {timeLabel}
          </span>
        )}
        {isEquipped && (
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1 ml-auto">
            <CheckCircle2 size={10} /> EQUIPPED
          </span>
        )}
        {item.earnableOnly && !isOwned && (
          <span className="text-[10px] uppercase tracking-widest text-amber-400/80 flex items-center gap-1 ml-auto">
            <Trophy size={10} /> EARNABLE
          </span>
        )}
      </div>

      {/* Icon / asset preview */}
      <div
        className={`flex items-center justify-center w-full overflow-hidden rounded-md ${hasExpandableImage ? 'h-40 cursor-zoom-in' : 'h-16'}`}
        onClick={() => {
          if (!onExpand) return;
          if (previewUrl) onExpand(previewUrl, item.name);
        }}
        title={hasExpandableImage && onExpand ? "Click to expand" : undefined}
      >
        {(() => {
          if (previewUrl) {
            return (
              <img
                src={previewUrl}
                alt={item.name}
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            );
          }
          return <div className="text-4xl opacity-60">{TYPE_ICONS[item.type]}</div>;
        })()}
      </div>

      {/* Name */}
      <div className="text-sm font-bold text-center">{item.name}</div>

      {/* Driver requirement badge (skins only) */}
      {item.type === 'driverSkin' && item.driverIds && item.driverIds.length > 0 && (
        <div className="flex items-center justify-center">
          <span className="text-[10px] bg-zinc-800/80 border border-white/10 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>🏎️</span>
            {item.driverIds.map((id) => DRIVER_DISPLAY_NAMES[id] ?? id).join(', ')}
          </span>
        </div>
      )}

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
      ) : item.cost === 0 ? (
        <Button
          size="sm"
          variant="default"
          className="text-xs bg-green-600 hover:bg-green-500 text-white"
          onClick={() => onPurchase(item.id)}
        >
          <ShoppingBag size={12} className="mr-1" /> Claim Free
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
  onExpand,
}: {
  profile: PlayerProfile;
  cosmetics: CosmeticItem[];
  onExpand?: (url: string, name: string) => void;
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
        const skinUrl = item?.type === 'driverSkin'
          ? (SKIN_ASSET_URLS[item.asset] ?? SKIN_ASSET_URLS[item.id] ?? null)
          : null;
        const bgUrl = item?.type === 'background' ? (CARD_BACKGROUND_URLS[item.asset] ?? CARD_BACKGROUND_URLS[item.id] ?? null) : null;
        const borderUrl = item?.type === 'border' ? (CARD_BORDER_URLS[item.asset] ?? CARD_BORDER_URLS[item.id] ?? null) : null;
        const logoUrl = item?.type === 'logo' ? (LOGO_ASSET_URLS[item.asset] ?? LOGO_ASSET_URLS[item.id] ?? (item?.asset && item.asset.startsWith('/') ? item.asset : null)) : null;
        const previewImgUrl = skinUrl ?? bgUrl ?? borderUrl ?? logoUrl ?? (item?.asset && item.asset.startsWith("/") ? item.asset : null);
        const hasImage = !!previewImgUrl;
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
                {hasImage ? (
                  <div
                    className={`w-full h-24 overflow-hidden rounded flex items-center justify-center ${onExpand ? 'cursor-zoom-in' : ''}`}
                    onClick={() => {
                      if (!onExpand) return;
                      if (previewImgUrl) onExpand(previewImgUrl, item.name);
                    }}
                    title={hasImage && onExpand ? "Click to expand" : undefined}
                  >
                    <img
                      src={previewImgUrl!}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="text-3xl opacity-80">{TYPE_ICONS[item.type]}</div>
                )}
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

// ─── Stripe Checkout Modal ───────────────────────────────────────────────────

interface CheckoutFormProps {
  packLabel: string;
  packPrice: string;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({ packLabel, packPrice, onSuccess, onClose }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
    } else {
      toast({ title: 'Payment successful!', description: `${packLabel} added to your wallet.` });
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <div className="text-lg font-bold text-white">Buy {packLabel}</div>
            <div className="text-sm text-zinc-400">One-time payment of {packPrice}</div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <PaymentElement />
          {errorMsg && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-500/20 rounded-lg px-3 py-2">
              {errorMsg}
            </div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 border-zinc-700" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting || !stripe}>
              {submitting ? 'Processing…' : `Pay ${packPrice}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PaymentModalProps {
  packKey: string;
  packLabel: string;
  packPrice: string;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentModal({ packKey, packLabel, packPrice, onSuccess, onClose }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    apiCreatePaymentIntent(packKey)
      .then(setClientSecret)
      .catch((err) => {
        setLoadError(String(err));
        toast({ title: 'Error', description: String(err), variant: 'destructive' });
      });
  }, [packKey]);

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
          <div className="text-red-400 text-sm">{loadError}</div>
          <Button onClick={onClose} variant="outline" className="w-full border-zinc-700">Close</Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <RefreshCw className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
      <CheckoutForm packLabel={packLabel} packPrice={packPrice} onSuccess={onSuccess} onClose={onClose} />
    </Elements>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Profile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<CosmeticType | "all">("all");
  const [paymentModal, setPaymentModal] = useState<null | { packKey: string; packLabel: string; packPrice: string }>(null);
  const [expandedSkin, setExpandedSkin] = useState<{ url: string; name: string } | null>(null);
  const [milestonesExpanded, setMilestonesExpanded] = useState(false);
  const [perfStatsExpanded, setPerfStatsExpanded] = useState(false);
  const [milestoneCategories, setMilestoneCategories] = useState<Record<string, boolean>>({
    progression: false,
    victories: false,
    collection: false,
    moments: false,
    secrets: false,
  });
  const { toast } = useToast();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchProfile(), fetchCosmetics()]);
      setProfile(p);
      setCosmetics(c);
      // If profile is still null after a successful fetch (e.g. server session not yet
      // established right after a restart while the client has stale auth cache), retry
      // once after a short delay before giving up and showing the error UI.
      // 1 500 ms is long enough for the server session middleware to settle after restart.
      if (!p && authUser) {
        setTimeout(async () => {
          try {
            const retried = await fetchProfile();
            if (retried) setProfile(retried);
          } catch { /* ignore retry errors */ }
        }, 1500 /* ms – one retry after server-session settle time */);
      }
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, authUser]);

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

  const handleBuyCredits = (pack: { amount: number; label: string; price: string }) => {
    setPaymentModal({ packKey: String(pack.amount), packLabel: pack.label, packPrice: pack.price });
  };

  const handleExpandSkin = (url: string, name: string) => {
    setExpandedSkin({ url, name });
  };

  const filteredCosmetics = cosmetics.filter(
    (c) => (filterType === "all" || c.type === filterType) && !c.limitedTime && c.id !== 'logo_default' && c.id !== 'border_default',
  );

  const limitedTimeCosmetics = cosmetics.filter(
    (c) => isLimitedTimeActive(c) && (filterType === "all" || c.type === filterType),
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
    <>
    <div className="min-h-screen text-white p-4 sm:p-8 flex flex-col items-center font-sans relative" style={{ backgroundImage: `url(${bgStandard1})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      {/* Dark translucent overlay — dulls the background like other game screens */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-4xl space-y-6">

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

        {/* ── Performance Stats ── */}
        {(() => {
          const wins = profile.winsPerMode as Record<string, number> ?? {};
          const games = profile.gamesPerMode as Record<string, number> ?? {};

          // SP vs MP
          const spWins = (wins.sp_standard ?? 0) + (wins.sp_social ?? 0) + (wins.sp_bio ?? 0) + (wins.sp_haunted ?? 0);
          const mpWins = (wins.mp_standard ?? 0) + (wins.mp_social ?? 0) + (wins.mp_bio ?? 0) + (wins.mp_haunted ?? 0);
          const spGames = (games.sp_standard ?? 0) + (games.sp_social ?? 0) + (games.sp_bio ?? 0) + (games.sp_haunted ?? 0);
          const mpGames = (games.mp_standard ?? 0) + (games.mp_social ?? 0) + (games.mp_bio ?? 0) + (games.mp_haunted ?? 0);

          // Competitive vs Casual — split by SP/MP
          const compWins = wins.comp ?? 0;
          const compGames = games.comp ?? 0;
          const spCompWins = wins.sp_comp ?? 0;
          const mpCompWins = wins.mp_comp ?? 0;
          const spCompGames = games.sp_comp ?? 0;
          const mpCompGames = games.mp_comp ?? 0;
          const totalW = profile.totalWins ?? 0;
          const totalG = profile.totalGames ?? 0;
          const casualWins = totalW - compWins;
          const casualGames = totalG - compGames;
          // SP/MP casual = (sp/mp totals) minus their respective comp games
          const spCasualGames = spGames - spCompGames;
          const mpCasualGames = mpGames - mpCompGames;
          const spCasualWins = spWins - spCompWins;
          const mpCasualWins = mpWins - mpCompWins;

          // Per variant — helpers for comp and casual breakdown by mode type
          const variantRows: Array<{ label: string; short: string; key: string; color: string; cellBg: string; rowBg: string }> = [
            { label: 'Standard', short: 'STD', key: 'standard', color: 'text-zinc-300', cellBg: 'bg-zinc-800/50 border-zinc-600/25', rowBg: 'border-zinc-700/30 bg-zinc-900/30' },
            { label: 'Social', short: 'SOC', key: 'social', color: 'text-purple-400', cellBg: 'bg-purple-950/50 border-purple-700/30', rowBg: 'border-purple-800/30 bg-purple-950/30' },
            { label: 'Bio', short: 'BIO', key: 'bio', color: 'text-orange-400', cellBg: 'bg-orange-950/40 border-orange-700/25', rowBg: 'border-orange-800/25 bg-orange-950/25' },
            { label: 'Haunted', short: 'HNT', key: 'haunted', color: 'text-teal-400', cellBg: 'bg-teal-950/40 border-teal-700/25', rowBg: 'border-teal-800/25 bg-teal-950/25' },
          ];

          // Competitive games/wins by variant (tracked server-side from new games forward)
          const compVariantGames = (key: string) =>
            (games[`sp_comp_${key}`] ?? 0) + (games[`mp_comp_${key}`] ?? 0);
          const compVariantWins = (key: string) =>
            (wins[`sp_comp_${key}`] ?? 0) + (wins[`mp_comp_${key}`] ?? 0);
          // Casual = total variant - competitive variant (clamped to 0 for historical data)
          const casualVariantGames = (key: string) =>
            Math.max(0, (games[`sp_${key}`] ?? 0) + (games[`mp_${key}`] ?? 0) - compVariantGames(key));
          const casualVariantWins = (key: string) =>
            Math.max(0, (wins[`sp_${key}`] ?? 0) + (wins[`mp_${key}`] ?? 0) - compVariantWins(key));

          const winRate = (w: number, g: number) =>
            g > 0 ? `${Math.round((w / g) * 100)}%` : '—';

          // Moment flag categories with per-type labels
          const flags = (profile.momentFlagsPerType as Record<string, number> | null | undefined) ?? {};
          const flagCategories: Array<{ label: string; icon: React.ReactNode; keys: string[] }> = [
            {
              label: 'Skill',
              icon: <Zap size={13} className="text-yellow-400" />,
              keys: ['CLUTCH_PLAY','PRECISION_STRIKE','OVERKILL','GENIUS_MOVE','FAKE_CALM','SMUG_CONFIDENCE','EASY_W'],
            },
            {
              label: 'Comeback & Events',
              icon: <Swords size={13} className="text-orange-400" />,
              keys: ['COMEBACK_HOPE','LAST_ONE_STANDING','LATE_PANIC','ELIMINATED','AFK'],
            },
            {
              label: 'Sync & Pattern',
              icon: <Target size={13} className="text-blue-400" />,
              keys: ['DEADLOCK_SYNC','MIRROR_MATCH'],
            },
            {
              label: 'Hidden / Easter Egg',
              icon: <Eye size={13} className="text-purple-400" />,
              keys: ['HIDDEN_67','HIDDEN_DEJA_BID','HIDDEN_REDEMPTION','HIDDEN_NAIL_IN_THE_COFFIN','HIDDEN_REDLINE_REVERSAL','PATCH_NOTES_PENDING'],
            },
          ];

          const hasAnyStats = totalG > 0 || Object.keys(flags).length > 0;
          if (!hasAnyStats) return null;

          return (
            <Card className="bg-yellow-950/50 border-yellow-700/50">
              <CardHeader className="pb-3">
                <button
                  className="flex items-center gap-2 w-full text-left focus:outline-none"
                  onClick={() => setPerfStatsExpanded(prev => !prev)}
                >
                  <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-white">
                    <BarChart2 size={16} className="text-primary" /> PERFORMANCE STATS
                  </CardTitle>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300 ml-auto", perfStatsExpanded && "rotate-180")} />
                </button>
              </CardHeader>
              {perfStatsExpanded && (
              <CardContent className="space-y-5">

                {/* Total trophy tally */}
                {(profile.convertedTrophies ?? 0) > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-700/25 bg-yellow-950/20 px-3 py-2">
                    <Trophy size={14} className="text-yellow-400 shrink-0" />
                    <span className="text-xl font-display font-bold text-white">{(profile.convertedTrophies ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 uppercase tracking-widest">Total Trophies</span>
                  </div>
                )}

                {/* SP vs MP */}
                {(spGames + mpGames > 0) && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Single Player vs Multiplayer</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'SP', games: spGames, wins: spWins, color: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-700/30' },
                        { label: 'MP', games: mpGames, wins: mpWins, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-700/30' },
                      ].map(({ label, games: g, wins: w, color, bg }) => (
                        <div key={label} className={`rounded-lg border px-4 py-3 ${bg}`}>
                          <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${color}`}>{label}</div>
                          <div className="text-2xl font-display font-bold text-white">{g} <span className="text-sm text-zinc-400 font-normal">games</span></div>
                          <div className="text-lg font-bold text-zinc-200">{w} <span className="text-sm text-zinc-400 font-normal">wins</span> <span className="text-sm text-zinc-500">({winRate(w, g)})</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitive vs Casual — with mode type sub-columns */}
                {totalG > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Competitive vs Casual</div>

                    {/* COMPETITIVE block */}
                    <div className="rounded-lg border bg-red-950/20 border-red-700/20 px-3 py-2 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-red-400 uppercase tracking-widest">Competitive</div>
                        <div className="text-base font-bold text-white">{compGames}g <span className="text-zinc-400 text-sm font-normal">· {compWins}W · {winRate(compWins, compGames)}</span></div>
                      </div>
                      {/* Mode type sub-columns */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {variantRows.map(({ short, key, color, cellBg }) => {
                          const g = compVariantGames(key);
                          const w = compVariantWins(key);
                          return (
                            <div key={key} className={`rounded border px-1.5 py-1.5 text-center ${cellBg}`}>
                              <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${color}`}>{short}</div>
                              <div className="text-base font-bold text-white leading-none">{g}</div>
                              <div className="text-[10px] text-zinc-400">{w}W</div>
                              <div className="text-[10px] text-zinc-500">{winRate(w, g)}</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* SP/MP split */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        <div className="rounded border border-sky-700/15 bg-sky-950/20 px-2 py-1 text-center">
                          <div className="text-[10px] font-bold text-sky-400 uppercase">SP</div>
                          <div className="text-sm font-bold text-white">{spCompGames}g</div>
                          <div className="text-[10px] text-zinc-400">{spCompWins}W · {winRate(spCompWins, spCompGames)}</div>
                        </div>
                        <div className="rounded border border-emerald-700/15 bg-emerald-950/20 px-2 py-1 text-center">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase">MP</div>
                          <div className="text-sm font-bold text-white">{mpCompGames}g</div>
                          <div className="text-[10px] text-zinc-400">{mpCompWins}W · {winRate(mpCompWins, mpCompGames)}</div>
                        </div>
                      </div>
                    </div>

                    {/* CASUAL block */}
                    <div className="rounded-lg border bg-zinc-800/30 border-zinc-700/20 px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Casual</div>
                        <div className="text-base font-bold text-white">{casualGames}g <span className="text-zinc-400 text-sm font-normal">· {casualWins}W · {winRate(casualWins, casualGames)}</span></div>
                      </div>
                      {/* Mode type sub-columns */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {variantRows.map(({ short, key, color, cellBg }) => {
                          const g = casualVariantGames(key);
                          const w = casualVariantWins(key);
                          return (
                            <div key={key} className={`rounded border px-1.5 py-1.5 text-center ${cellBg}`}>
                              <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${color}`}>{short}</div>
                              <div className="text-base font-bold text-white leading-none">{g}</div>
                              <div className="text-[10px] text-zinc-400">{w}W</div>
                              <div className="text-[10px] text-zinc-500">{winRate(w, g)}</div>
                            </div>
                          );
                        })}
                      </div>
                      {/* SP/MP split */}
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        <div className="rounded border border-sky-700/15 bg-sky-950/20 px-2 py-1 text-center">
                          <div className="text-[10px] font-bold text-sky-400 uppercase">SP</div>
                          <div className="text-sm font-bold text-white">{spCasualGames}g</div>
                          <div className="text-[10px] text-zinc-400">{spCasualWins}W · {winRate(spCasualWins, spCasualGames)}</div>
                        </div>
                        <div className="rounded border border-emerald-700/15 bg-emerald-950/20 px-2 py-1 text-center">
                          <div className="text-[10px] font-bold text-emerald-400 uppercase">MP</div>
                          <div className="text-sm font-bold text-white">{mpCasualGames}g</div>
                          <div className="text-[10px] text-zinc-400">{mpCasualWins}W · {winRate(mpCasualWins, mpCasualGames)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Per game pace / variant — split by SP/MP */}
                {variantRows.some(({ key }) => (games[`sp_${key}`] ?? 0) + (games[`mp_${key}`] ?? 0) > 0) && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Games by Mode Type</div>
                    <div className="space-y-2">
                      {variantRows.map(({ label, key, color, rowBg }) => {
                        const spG = games[`sp_${key}`] ?? 0;
                        const mpG = games[`mp_${key}`] ?? 0;
                        const spW = wins[`sp_${key}`] ?? 0;
                        const mpW = wins[`mp_${key}`] ?? 0;
                        if (spG + mpG === 0) return null;
                        return (
                          <div key={key} className={`rounded-lg border px-3 py-2 ${rowBg}`}>
                            <div className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${color}`}>{label}</div>
                            <div className="grid grid-cols-2 gap-2">
                              {spG > 0 && (
                                <div className="rounded border border-sky-700/20 bg-sky-950/30 px-2 py-1.5">
                                  <div className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-0.5">SP</div>
                                  <div className="text-base font-bold text-white">{spG} <span className="text-xs text-zinc-400 font-normal">games</span></div>
                                  <div className="text-sm font-bold text-zinc-200">{spW}W <span className="text-zinc-500 text-xs">· {winRate(spW, spG)}</span></div>
                                </div>
                              )}
                              {mpG > 0 && (
                                <div className="rounded border border-emerald-700/20 bg-emerald-950/30 px-2 py-1.5">
                                  <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">MP</div>
                                  <div className="text-base font-bold text-white">{mpG} <span className="text-xs text-zinc-400 font-normal">games</span></div>
                                  <div className="text-sm font-bold text-zinc-200">{mpW}W <span className="text-zinc-500 text-xs">· {winRate(mpW, mpG)}</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Moment flag tallies by category */}
                {Object.keys(flags).length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">Moment Flag Tallies</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {flagCategories.map(({ label, icon, keys }) => {
                        const total = keys.reduce((s, k) => s + (flags[k] ?? 0), 0);
                        const activeKeys = keys.filter((k) => (flags[k] ?? 0) > 0);
                        if (total === 0) return null;
                        return (
                          <div key={label} className="rounded-lg border border-purple-800/20 bg-purple-950/20 px-3 py-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1">
                                {icon}
                                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wide leading-tight">{label}</span>
                              </div>
                              <span className="text-base font-bold text-white">{total} <span className="text-xs text-zinc-400 font-normal">total</span></span>
                            </div>
                            <div className="space-y-0.5">
                              {activeKeys.map((k) => (
                                <div key={k} className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-400">{FLAG_LABELS[k] ?? k}</span>
                                  <span className="text-sm font-mono font-bold text-zinc-200">×{flags[k]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </CardContent>
              )}
            </Card>
          );
        })()}

        {/* ── Equipped Cosmetics Preview ── */}
        <Card className="bg-gradient-to-r from-yellow-950/40 to-primary/10 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-zinc-400">
              <Sparkles size={16} className="text-primary" /> CURRENTLY EQUIPPED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EquippedPreview profile={profile} cosmetics={cosmetics} onExpand={handleExpandSkin} />
          </CardContent>
        </Card>

        {/* ── Milestones ── */}
        {(() => {
          const categoryDefinitions: Array<{
            key: string;
            label: string;
            icon: React.ReactNode;
            ids: string[];
          }> = [
            {
              key: 'progression',
              label: 'PROGRESSION',
              icon: <Trophy size={14} className="text-yellow-500" />,
              ids: [
                'milestone_first_game','milestone_10_games','milestone_50_games','milestone_100_games',
                'milestone_10_wins','milestone_first_win','milestone_25_wins','milestone_50_wins',
                'milestone_100_wins','milestone_500_wins','milestone_credits_5000','milestone_credits_1000000',
              ],
            },
            {
              key: 'victories',
              label: 'VICTORIES',
              icon: <Flag size={14} className="text-blue-400" />,
              ids: [
                'milestone_sp_10_wins','milestone_mp_5_wins','milestone_mp_25_wins',
                'milestone_sprint_5_wins','milestone_social_5_wins','milestone_bio_5_wins',
                'milestone_5_haunted_wins','milestone_haunted_10_wins',
                'milestone_competitive_first_win','milestone_competitive_5_wins',
                'milestone_competitive_25_wins','milestone_competitive_50_wins',
              ],
            },
            {
              key: 'collection',
              label: 'COLLECTION',
              icon: <Sparkles size={14} className="text-purple-400" />,
              ids: ['milestone_collector_5','milestone_fashion_icon'],
            },
            {
              key: 'moments',
              label: 'MOMENTS',
              icon: <Target size={14} className="text-primary" />,
              ids: [
                'milestone_flags_10','milestone_flags_50','milestone_flags_100','milestone_flags_250',
                'milestone_clutch_3x','milestone_clutch_10x','milestone_precision_5x','milestone_overkill_3x',
                'milestone_late_panic_5x','milestone_genius_5x','milestone_fake_calm_5x','milestone_smug_3x',
                'milestone_last_standing_3x','milestone_last_standing_10x',
                'milestone_comeback_5x','milestone_comeback_10x',
                'milestone_deadlock_3x','milestone_mirror_3x','milestone_deadlock_and_mirror',
                'milestone_easy_w_5x','milestone_unique_10_flag_types',
              ],
            },
            {
              key: 'secrets',
              label: 'SECRETS',
              icon: <Lock size={14} className="text-zinc-400" />,
              ids: [
                'milestone_easter_egg_first','milestone_easter_egg_two','milestone_easter_egg_all',
                'milestone_hidden_67_3x','milestone_hidden_redemption_first',
                'milestone_hidden_nail_3x','milestone_hidden_deja_bid',
              ],
            },
          ];

          const totalCompleted = MILESTONES_DISPLAY.filter((m) =>
            (profile.milestoneUnlocks as string[]).includes(m.id) ||
            (m.cosmeticId ? (profile.ownedCosmetics as string[]).includes(m.cosmeticId) : false)
          ).length;

          return (
            <Card className="bg-purple-950/50 border-purple-700/50">
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setMilestonesExpanded((v) => !v)}
              >
                <CardTitle className="flex items-center justify-between text-sm tracking-widest text-white">
                  <span className="flex items-center gap-2">
                    <Target size={16} className="text-yellow-500" /> MILESTONES
                    <span className="text-[10px] text-zinc-600 font-normal normal-case tracking-normal">
                      ({totalCompleted} / {MILESTONES_DISPLAY.length} completed)
                    </span>
                  </span>
                  <span className="text-zinc-600 text-xs">{milestonesExpanded ? '▲ Collapse' : '▼ Expand'}</span>
                </CardTitle>
              </CardHeader>
              {milestonesExpanded && (
                <CardContent className="space-y-3">
                  {categoryDefinitions.map((cat) => {
                    const catMilestones = MILESTONES_DISPLAY.filter((m) => cat.ids.includes(m.id));
                    const catCompleted = catMilestones.filter((m) =>
                      (profile.milestoneUnlocks as string[]).includes(m.id) ||
                      (m.cosmeticId ? (profile.ownedCosmetics as string[]).includes(m.cosmeticId) : false)
                    ).length;
                    const isOpen = milestoneCategories[cat.key];
                    return (
                      <div key={cat.key} className="rounded-lg border border-white/5 overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors"
                          onClick={() =>
                            setMilestoneCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))
                          }
                        >
                          <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-white">
                            {cat.icon} {cat.label}
                            <span className="text-[10px] text-zinc-600 font-normal normal-case tracking-normal">
                              ({catCompleted}/{catMilestones.length})
                            </span>
                          </span>
                          <span className="text-zinc-600 text-[10px]">{isOpen ? '▲' : '▼'}</span>
                        </button>
                        {isOpen && (
                          <div className="px-3 pb-3 space-y-4 border-t border-white/5 pt-3">
                            {catMilestones.map((m) => {
                              const progress = m.getProgress(profile);
                              const pct = Math.min(100, Math.round((progress / m.goal) * 100));
                              const unlocked =
                                (profile.milestoneUnlocks as string[]).includes(m.id) ||
                                (m.cosmeticId
                                  ? (profile.ownedCosmetics as string[]).includes(m.cosmeticId)
                                  : false);
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })()}

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
            {/* Limited-Time Section */}
            {limitedTimeCosmetics.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Clock size={14} className="text-orange-400" />
                  <span className="text-sm font-bold text-orange-400 uppercase tracking-widest">Limited Time</span>
                  <span className="text-xs text-zinc-500">— Rotates out when the timer ends</span>
                </div>
                <div className="rounded-lg border border-orange-500/20 bg-orange-950/10 p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {limitedTimeCosmetics.map((item) => (
                      <CosmeticCard
                        key={item.id}
                        item={item}
                        isOwned={(profile.ownedCosmetics as string[]).includes(item.id)}
                        isEquipped={Object.values(profile.equippedCosmetics as Record<string, string>).includes(item.id)}
                        canAfford={profile.currencyBalance >= item.cost}
                        onPurchase={handlePurchase}
                        onEquip={handleEquip}
                        onUnequip={handleUnequip}
                        onExpand={handleExpandSkin}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {filteredCosmetics.length === 0 && limitedTimeCosmetics.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">No items in this category.</p>
            ) : filteredCosmetics.length > 0 ? (
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
                    onExpand={handleExpandSkin}
                  />
                ))}
              </div>
            ) : null}
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
                    onExpand={handleExpandSkin}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Buy Credits ── */}
        <Card className="bg-gradient-to-r from-yellow-950/40 to-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                  <Coins size={14} className="text-primary" /> Buy Credits
                </div>
                <div className="text-xs text-zinc-500">Credits are added instantly after payment</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CREDIT_PACKS.map((pack) => (
                <Button
                  key={pack.amount}
                  variant="outline"
                  size="sm"
                  className="text-xs border-zinc-700 hover:border-primary hover:bg-primary/10 transition-all"
                  onClick={() => handleBuyCredits(pack)}
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

    {/* ── Payment Modal ── */}
    {paymentModal && (
      <PaymentModal
        packKey={paymentModal.packKey}
        packLabel={paymentModal.packLabel}
        packPrice={paymentModal.packPrice}
        onSuccess={load}
        onClose={() => setPaymentModal(null)}
      />
    )}

    {/* ── Expanded Skin Image Modal ── */}
    {expandedSkin && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={() => setExpandedSkin(null)}
      >
        <div
          className="relative max-w-lg w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-zinc-400 hover:text-white"
            onClick={() => setExpandedSkin(null)}
          >
            <X size={20} />
          </button>
          <div className="text-sm font-bold text-zinc-200">{expandedSkin.name}</div>
          <img
            src={expandedSkin.url}
            alt={expandedSkin.name}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        </div>
      </div>
    )}
    </>
  );
}
