"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Model, { type IExerciseData } from "react-body-highlighter";
import { useClientStore } from "@/store/clientStore";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

// Muscles to highlight — tells the story of a recent training session
const DEMO_DATA: IExerciseData[] = [
  { name: "Push Session", muscles: ["chest", "biceps", "abs"], frequency: 1 },
  { name: "Accessory", muscles: ["front-deltoids", "quadriceps"], frequency: 1 },
];

function BodySilhouetteIllustration() {
  const { mounted, isDark, hydrate } = useClientStore();
  useEffect(hydrate, [hydrate]);

  const bodyColor = isDark ? "#252521" : "#CAC5BE";
  const highlightedColors = isDark
    ? ["#E8633A66", "#E8633A"]
    : ["#d9775766", "#d97757"];

  return (
    <div className="relative flex flex-col items-center justify-center py-8 gap-3">
      <div className="accent-glow absolute inset-0 rounded-2xl" />
      {mounted ? (
        <div id="landing-body-model" className="w-36 relative" aria-hidden="true">
          <Model
            data={DEMO_DATA}
            type="anterior"
            bodyColor={bodyColor}
            highlightedColors={highlightedColors}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      ) : (
        <div className="w-36" style={{ aspectRatio: "160 / 340" }} />
      )}
      {mounted && (
        <p className="text-xs text-muted font-sans tracking-wide select-none">
          hover to explore
        </p>
      )}
    </div>
  );
}

function ConstellationIllustration() {
  const nodes = [
    { cx: 150, cy: 110, r: 9, opacity: 0.9 }, // central
    { cx: 78, cy: 58, r: 5, opacity: 0.5 },
    { cx: 232, cy: 68, r: 5, opacity: 0.55 },
    { cx: 58, cy: 158, r: 4, opacity: 0.4 },
    { cx: 242, cy: 162, r: 5, opacity: 0.45 },
    { cx: 108, cy: 192, r: 4, opacity: 0.35 },
    { cx: 202, cy: 198, r: 4, opacity: 0.4 },
    { cx: 172, cy: 42, r: 3, opacity: 0.3 },
    { cx: 88, cy: 132, r: 4, opacity: 0.38 },
  ];
  const central = nodes[0];
  const spokes = nodes.slice(1).map((n, i) => ({ ...n, key: i }));
  const crossLines = [
    [1, 2],
    [1, 3],
    [2, 4],
    [5, 6],
    [7, 8],
  ] as [number, number][];

  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="accent-glow absolute inset-0 rounded-2xl" />
      <svg
        viewBox="0 0 300 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-xs h-auto relative"
        aria-hidden="true"
      >
        {/* Spoke lines from central node */}
        {spokes.map((n) => (
          <line
            key={n.key}
            x1={central.cx}
            y1={central.cy}
            x2={n.cx}
            y2={n.cy}
            stroke="var(--c-accent)"
            strokeWidth="0.8"
            opacity="0.22"
          />
        ))}
        {/* Cross-connections */}
        {crossLines.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].cx}
            y1={nodes[a].cy}
            x2={nodes[b].cx}
            y2={nodes[b].cy}
            stroke="var(--c-accent)"
            strokeWidth="0.6"
            opacity="0.12"
          />
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r * 2.8}
              style={{ fill: "var(--c-accent)" }}
              opacity={n.opacity * 0.1}
            />
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              style={{ fill: "var(--c-accent)" }}
              opacity={n.opacity * 0.7}
            />
          </g>
        ))}
        {/* Central pulse rings */}
        <circle
          cx={central.cx}
          cy={central.cy}
          r="22"
          style={{ fill: "var(--c-accent)" }}
          opacity="0.08"
        />
        <circle
          cx={central.cx}
          cy={central.cy}
          r="36"
          style={{ fill: "var(--c-accent)" }}
          opacity="0.04"
        />
      </svg>
    </div>
  );
}

function ProgressCurveIllustration() {
  const pts = [
    { x: 28, y: 180 },
    { x: 68, y: 158 },
    { x: 112, y: 138 },
    { x: 156, y: 112 },
    { x: 196, y: 84 },
    { x: 236, y: 58 },
    { x: 272, y: 36 },
  ];

  // Smooth cubic bezier through points
  const linePath = pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${d} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }, "");

  const areaPath = `${linePath} L${pts[pts.length - 1].x},210 L${pts[0].x},210 Z`;

  return (
    <div className="relative flex items-center justify-center py-8">
      <div className="accent-glow absolute inset-0 rounded-2xl" />
      <svg
        viewBox="0 0 300 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-xs h-auto relative"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[60, 110, 160].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="285"
            y2={y}
            stroke="var(--c-border-subtle)"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#pg)" />
        {/* Curve */}
        <path
          d={linePath}
          stroke="var(--c-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data dots */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            style={{ fill: "var(--c-bg)" }}
            stroke="var(--c-accent)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

const features = [
  {
    number: "01",
    title: "Recovery Intelligence",
    description:
      "Real-time muscle recovery maps built from your workout history. See exactly which muscles are ready to train and which need more time — updated after every session.",
    visual: <BodySilhouetteIllustration />,
  },
  {
    number: "02",
    title: "AI-Powered Suggestions",
    description:
      "Get personalized workout plans generated from your current recovery state. The AI considers your muscle readiness, training history, and goals to suggest the optimal split for today.",
    visual: <ConstellationIllustration />,
  },
  {
    number: "03",
    title: "Progress Analytics",
    description:
      "Track strength gains and body weight trends with clean visual analytics. See your estimated 1RMs climb over time and correlate progress with your training patterns.",
    visual: <ProgressCurveIllustration />,
  },
];

function CTAButtons({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="px-7 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-[var(--c-accent-hover)] transition-colors"
      >
        Go to Dashboard
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/auth/signup"
        className="px-7 py-3 bg-accent text-white rounded-lg text-sm font-medium hover:bg-[var(--c-accent-hover)] transition-colors"
      >
        Get Started
      </Link>
      <Link
        href="/auth/signin"
        className="px-7 py-3 border border-border text-secondary rounded-lg text-sm font-medium hover:text-primary hover:bg-surface transition-colors"
      >
        Log in
      </Link>
    </>
  );
}

interface Props {
  isAuthenticated: boolean;
}

export function LandingClient({ isAuthenticated }: Props) {
  return (
    <div className="grain-overlay bg-bg">
      {/* ── Hero ── */}
      <section className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-4 sm:px-8 text-center relative">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto"
        >
          <motion.p
            variants={heroItem}
            transition={{ duration: 0.5, ease }}
            className="text-xs uppercase tracking-widest text-muted mb-6 font-sans"
          >
            Your recovery, intelligently tracked
          </motion.p>

          <motion.h1
            variants={heroItem}
            transition={{ duration: 0.6, ease }}
            className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.95] text-primary mb-6"
          >
            Train smarter.
            <br />
            Recover faster.
          </motion.h1>

          <motion.p
            variants={heroItem}
            transition={{ duration: 0.55, ease }}
            className="text-base sm:text-lg text-secondary max-w-lg mx-auto mb-10 font-sans leading-relaxed"
          >
            Recvr tracks muscle fatigue in real time so you always know what to
            train next — and when to rest.
          </motion.p>

          <motion.div
            variants={heroItem}
            transition={{ duration: 0.5, ease }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <CTAButtons isAuthenticated={isAuthenticated} />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2, ease }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted"
          aria-hidden="true"
        >
          <div className="w-px h-8 bg-current opacity-40" />
          <svg
            className="scroll-indicator w-4 h-4 opacity-60"
            fill="none"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6l4 4 4-4"
            />
          </svg>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted text-center mb-16 font-sans">
            What you get
          </p>

          {features.map((feature, i) => (
            <div key={feature.number}>
              {i > 0 && <hr className="border-border-subtle" />}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 py-16 sm:py-20 items-center"
              >
                {/* Text side */}
                <div>
                  <span className="font-display text-5xl text-accent opacity-30 leading-none block mb-4">
                    {feature.number}
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl text-primary mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-secondary leading-relaxed max-w-md">
                    {feature.description}
                  </p>
                </div>

                {/* Visual side — swap to left on even rows */}
                <div className={i % 2 === 1 ? "md:order-first" : ""}>
                  {feature.visual}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="py-24 sm:py-32 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary mb-6">
            Ready to train smarter?
          </h2>
          <p className="text-secondary mb-10 leading-relaxed max-w-md mx-auto">
            Join athletes who train with purpose. Recvr turns your workout
            history into a personalized recovery blueprint.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <CTAButtons isAuthenticated={isAuthenticated} />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
