import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Using a Mixkit preview URL for suspenseful background music
  // Ensure this URL is valid or replace with a local asset if available
  const MUSIC_URL = "https://assets.mixkit.co/music/preview/mixkit-raising-the-stakes-1100.mp3";

  useEffect(() => {
    // Attempt to auto-play on mount (often blocked by browsers until interaction)
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0.3; // Low background volume
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Auto-play blocked, waiting for user interaction");
          setIsPlaying(false);
        }
      }
    };
    playAudio();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : 0.3;
    }
  }, [isMuted]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      audioRef.current.volume = !isMuted ? 0 : 0.3;
    }
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
       <audio 
         ref={audioRef} 
         src={MUSIC_URL} 
         loop 
         preload="auto"
       />
       <Button 
         variant="outline" 
         size="icon" 
         className="bg-black/40 border-white/10 hover:bg-white/10 text-primary rounded-full w-10 h-10 backdrop-blur-sm"
         onClick={toggleMute}
         title={isMuted ? "Unmute Music" : "Mute Music"}
       >
         {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
       </Button>
    </div>
  );
}
