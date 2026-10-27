"use client";

import { useEffect, useRef } from "react";
import { gloveSvg } from "@/components/glove/glove";

/** The gloved hand, large, to judge the drawing. */
export default function GloveMockup() {
  const right = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  useEffect(() => {
    right.current!.innerHTML = gloveSvg();
    left.current!.innerHTML = gloveSvg(true);
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center bg-[#1a1420] p-10">
      <div className="flex items-end gap-16">
        <div ref={left} className="w-[200px]" />
        <div ref={right} className="w-[260px]" />
      </div>
    </main>
  );
}
