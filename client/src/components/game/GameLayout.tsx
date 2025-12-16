import React from "react";
import { cn } from "@/lib/utils";
import background from "@assets/generated_images/dark_futuristic_abstract_auction_background.png";

interface GameLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function GameLayout({ children, className }: GameLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${background})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background/80 via-background/90 to-background pointer-events-none" />
      
      {/* Content */}
      <div className={cn("relative z-10 container mx-auto px-4 py-6 min-h-screen flex flex-col", className)}>
        {children}
      </div>
    </div>
  );
}
