"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

type Zone = "auth" | "app" | "unknown";
type Direction = -1 | 0 | 1;

function getZone(pathname: string | null): Zone {
  if (!pathname) return "unknown";
  if (pathname.startsWith("/auth")) return "auth";
  return "app";
}

function getDirection(prev: string | null, next: string): Direction {
  if (!prev) return 0;
  const prevZone = getZone(prev);
  const nextZone = getZone(next);
  if (prevZone === nextZone) return 0;
  if (prevZone === "auth" && nextZone === "app") return 1;
  if (prevZone === "app" && nextZone === "auth") return -1;
  return 0;
}

function useDirection(): { pathname: string; direction: Direction } {
  const pathname = usePathname();
  const prevRef = useRef<string | null>(null);
  const direction = getDirection(prevRef.current, pathname);
  if (prevRef.current !== pathname) prevRef.current = pathname;
  return { pathname, direction };
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname, direction } = useDirection();
  const initial =
    direction === 0 ? { opacity: 0, y: 8, x: 0 } : { opacity: 0, y: 0, x: direction * 50 };

  return (
    <motion.div
      key={pathname}
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
