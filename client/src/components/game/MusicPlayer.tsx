import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MusicPlayer({
  soundEnabled,
  onToggleSound,
}: {
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Button
        data-testid="button-toggle-sound"
        variant="outline"
        size="icon"
        className="bg-black/40 border-white/10 hover:bg-white/10 text-primary rounded-full w-10 h-10 backdrop-blur-sm"
        onClick={onToggleSound}
        title={soundEnabled ? "Mute" : "Unmute"}
      >
        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </Button>
    </div>
  );
}
