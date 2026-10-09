"use client";
// Motion primitives. Tilt, Magnet, ClickSpark, CircularSeal and CountUp are adapted from React Bits
// (local design repo: react-bits-main.zip); smooth scrolling uses Lenis (lenis-main.zip).
// Every effect turns itself off for touch pointers and prefers-reduced-motion.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Lenis from "lenis";
import { cn } from "@/lib/utils";

export const EASE_OUT = [0.22, 1, 0.36, 1];

/** True only for hover-capable fine pointers (mouse/trackpad), never on touch. */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return fine;
}

const useRichMotion = () => {
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  return fine && !reduce;
};

/* ── Lenis smooth scroll ──────────────────────────────────────────────── */
export function SmoothScroll({ children }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      // Let dialogs, selects and anything marked data-lenis-prevent scroll natively.
      prevent: (node) => Boolean(node.closest?.("[data-slot=dialog-content],[data-slot=select-content],[data-lenis-prevent]")),
    });
    lenisRef.current = lenis;
    let frame = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    });
    // Radix locks scrolling with data-scroll-locked on <body>; pause Lenis while that's set.
    const observer = new MutationObserver(() => (document.body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduce]);

  // New route = new page: jump to the top instead of animating there.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return children;
}

/* ── Reveal on scroll ─────────────────────────────────────────────────── */
export function Reveal({ as = "div", delay = 0, y = 18, className, children, ...props }) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.68, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </Comp>
  );
}

/* ── Tilt with foil glare (from React Bits TiltedCard) ───────────────── */
export function Tilt({ children, className, amplitude = 9, radius = 26 }) {
  const ref = useRef(null);
  const on = useRichMotion();
  const spring = { damping: 26, stiffness: 160, mass: 1 };
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(30);
  const glare = useSpring(0, { stiffness: 220, damping: 30 });
  const background = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x}% ${y}%, rgb(255 255 255 / 0.55), transparent 42%), linear-gradient(${105 + x / 2}deg, transparent 30%, rgb(255 214 170 / 0.18) 45%, rgb(170 220 210 / 0.16) 55%, transparent 70%)`,
  );

  const onMove = (e) => {
    if (!on || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - py) * amplitude * 2);
    rotateY.set((px - 0.5) * amplitude * 2);
    glareX.set(px * 100);
    glareY.set(py * 100);
    glare.set(1);
  };
  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    glare.set(0);
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("[perspective:1100px]", className)}>
      <motion.div className="relative" style={on ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}>
        {children}
        {on && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background, opacity: glare, borderRadius: radius }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ── Magnet (from React Bits Magnet, spring-based) ───────────────────── */
export function Magnet({ children, strength = 5, padding = 70, className }) {
  const ref = useRef(null);
  const on = useRichMotion();
  const x = useSpring(0, { stiffness: 200, damping: 18 });
  const y = useSpring(0, { stiffness: 200, damping: 18 });

  useEffect(() => {
    if (!on) return;
    const move = (e) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const near = Math.abs(e.clientX - cx) < rect.width / 2 + padding && Math.abs(e.clientY - cy) < rect.height / 2 + padding;
      x.set(near ? (e.clientX - cx) / strength : 0);
      y.set(near ? (e.clientY - cy) / strength : 0);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [on, padding, strength, x, y]);

  return (
    <motion.div ref={ref} className={cn("inline-block", className)} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

/* ── Click sparks (from React Bits ClickSpark; draws only while sparks exist) ── */
export function ClickSpark({ children, color = "var(--primary)", count = 9, radius = 26, size = 11, duration = 480, className }) {
  const canvasRef = useRef(null);
  const sparks = useRef([]);
  const frame = useRef(0);
  const reduce = useReducedMotion();
  const BLEED = 32; // canvas extends past the child so sparks aren't clipped

  const draw = useCallback(
    (time) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = getComputedStyle(canvas).color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      sparks.current = sparks.current.filter((s) => {
        const t = (time - s.start) / duration;
        if (t >= 1) return false;
        const eased = t * (2 - t);
        const dist = eased * radius;
        const len = size * (1 - eased);
        ctx.beginPath();
        ctx.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
        ctx.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
        ctx.stroke();
        return true;
      });
      frame.current = sparks.current.length ? requestAnimationFrame(draw) : 0;
    },
    [duration, radius, size],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onClick = (e) => {
    const canvas = canvasRef.current;
    if (reduce || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      sparks.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, angle: (2 * Math.PI * i) / count + Math.random() * 0.3, start: now });
    }
    if (!frame.current) frame.current = requestAnimationFrame(draw);
  };

  return (
    <span className={cn("relative inline-block", className)} onClickCapture={onClick}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ inset: -BLEED, width: `calc(100% + ${BLEED * 2}px)`, height: `calc(100% + ${BLEED * 2}px)`, color }}
      />
      {children}
    </span>
  );
}

/* ── Rotating seal (from React Bits CircularText, as an SVG textPath) ── */
export function CircularSeal({ text, size = 132, duration = 26, className, children }) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, "");
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ repeat: Infinity, ease: "linear", duration }}
        aria-hidden
      >
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-mono text-[8.6px] font-medium tracking-[0.2em] uppercase">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </motion.svg>
      <span className="sr-only">{text}</span>
      {children}
    </div>
  );
}

/* ── Count-up (from React Bits CountUp) ──────────────────────────────── */
export function CountUp({ to, duration = 1.4, className }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const value = useMotionValue(0);
  const spring = useSpring(value, { damping: 20 + 40 / duration, stiffness: 100 / duration });

  useEffect(() => {
    if (!ref.current) return;
    if (reduce) {
      ref.current.textContent = String(to);
      return;
    }
    if (inView) value.set(to);
  }, [inView, reduce, to, value]);

  useEffect(() => spring.on("change", (v) => ref.current && (ref.current.textContent = Math.round(v).toLocaleString())), [spring]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      0
    </span>
  );
}
