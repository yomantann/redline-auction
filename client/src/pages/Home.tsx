import React from "react";
import Game from "@/pages/Game";

export default function Home() {
  // Since we are doing a single page prototype mostly, we can just render Game here
  // Or have a Landing page. Let's redirect to Game for simplicity as the Game component handles Intro state.
  return <Game />;
}
