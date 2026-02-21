import React from "react";
import { cn } from "@/lib/utils";
import bgStandard from "../../assets/generated_images/bg_standard_5.png";
import bgSocial from "../../assets/generated_images/bg_social_1.png";
import bgBio from "../../assets/generated_images/bg_bio_fuel_v6.png";

type RealityMode = "STANDARD" | "SOCIAL_OVERDRIVE" | "BIO_FUEL";

interface GameLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: RealityMode;
}

export function GameLayout({ children, className, variant = "STANDARD" }: GameLayoutProps) {
  const background = variant === "SOCIAL_OVERDRIVE" ? bgSocial : variant === "BIO_FUEL" ? bgBio : bgStandard;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground no-callout">
      {/* Background Image with Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 pointer-events-none",
          variant === "STANDARD" ? "opacity-75" : "opacity-75"
        )}
        style={{ backgroundImage: `url(${background})` }}
        aria-hidden="true"
        data-testid="img-background"
      />

      <div
        className={cn(
          "fixed inset-0 z-0 pointer-events-none",
          variant === "SOCIAL_OVERDRIVE" && "bg-gradient-to-b from-purple-950/40 via-background/80 to-background",
          variant === "BIO_FUEL" && "bg-gradient-to-b from-orange-950/35 via-background/80 to-background",
          variant === "STANDARD" && "bg-gradient-to-b from-background/55 via-background/85 to-background"
        )}
      />

      {/* Content */}
      <div className={cn("relative z-10 container mx-auto px-4 py-6 min-h-screen flex flex-col", className)}>
        {children}
      </div>
    </div>
  );
}
