import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const BEAMS = [
  { initialX: 10,   duration: 7,  repeatDelay: 3,  delay: 2 },
  { initialX: 600,  duration: 3,  repeatDelay: 3,  delay: 4 },
  { initialX: 100,  duration: 7,  repeatDelay: 7,  className: "h-6" },
  { initialX: 400,  duration: 5,  repeatDelay: 14, delay: 4 },
  { initialX: 800,  duration: 11, repeatDelay: 2,  className: "h-20" },
  { initialX: 1000, duration: 4,  repeatDelay: 2,  delay: 8 },
  { initialX: 1200, duration: 6,  repeatDelay: 4,  delay: 2, className: "h-12" },
];

export function BackgroundBeamsWithCollision({ children, className, ...props }) {
  const containerRef = useRef(null);
  const parentRef = useRef(null);

  return (
    <div
      ref={parentRef}
      className={cn("relative flex items-center w-full justify-center [overflow:clip]", className)}
      {...props}
    >
      {BEAMS.map((beam) => (
        <CollisionMechanism
          key={beam.initialX + beam.duration + (beam.delay ?? 0)}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      ))}

      {children}

      {/* Linha de colisão — invisível, fica exatamente no fundo */}
      <div
        ref={containerRef}
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "1px" }}
      />
    </div>
  );
}

function CollisionMechanism({ parentRef, containerRef, beamOptions = {} }) {
  const beamRef = useRef(null);
  const [collision, setCollision] = useState({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (!beamRef.current || !containerRef.current || !parentRef.current || cycleCollisionDetected) return;

      const beamRect   = beamRef.current.getBoundingClientRect();
      const targetRect = containerRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      if (beamRect.bottom >= targetRect.top) {
        const x = beamRect.left - parentRect.left + beamRect.width / 2;
        const y = targetRect.top - parentRect.top; // posição exata do bottom
        setCollision({ detected: true, coordinates: { x, y } });
        setCycleCollisionDetected(true);
      }
    };

    const id = setInterval(checkCollision, 50);
    return () => clearInterval(id);
  }, [cycleCollisionDetected, containerRef, parentRef]);

  useEffect(() => {
    if (!collision.detected || !collision.coordinates) return;
    const t1 = setTimeout(() => {
      setCollision({ detected: false, coordinates: null });
      setCycleCollisionDetected(false);
    }, 2000);
    const t2 = setTimeout(() => setBeamKey((k) => k + 1), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [collision]);

  // Calcula a distância que o feixe precisa percorrer com base na altura do container
  const getTranslateY = () => {
    if (!parentRef.current) return "110vh";
    return `${parentRef.current.offsetHeight + 200}px`;
  };

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        initial={{ translateY: "-220px", translateX: `${beamOptions.initialX ?? 0}px` }}
        animate={{ translateY: getTranslateY(), translateX: `${beamOptions.initialX ?? 0}px` }}
        transition={{
          duration: beamOptions.duration ?? 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beamOptions.delay ?? 0,
          repeatDelay: beamOptions.repeatDelay ?? 0,
        }}
        className={cn(
          "absolute left-0 top-0 h-14 w-px rounded-full bg-gradient-to-t from-emerald-500 via-emerald-300 to-transparent",
          beamOptions.className,
        )}
      />

      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            style={{
              left: `${collision.coordinates.x}px`,
              top:  `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Explosion(props) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    dx: Math.floor(Math.random() * 80 - 40),
    dy: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className="absolute z-50 h-2 w-2 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-300 to-green-200 blur-sm"
      />
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0 }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-green-200"
        />
      ))}
    </div>
  );
}
