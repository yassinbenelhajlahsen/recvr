"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  best1RM: number;
  best1RMDate: string | null;
  sessions: number;
  animationKey: string;
};


export function StatsBar({ animationKey }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col gap-3"
      >
      </motion.div>
    </AnimatePresence>
  );
}
