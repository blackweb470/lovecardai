import { Heart } from "lucide-react";

const FloatingHearts = () => {
  const hearts = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${10 + i * 15}%`,
    delay: `${i * 0.5}s`,
    size: 14 + (i % 3) * 6,
    duration: `${3 + (i % 3)}s`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="absolute text-primary/15 animate-float-heart"
          style={{
            left: h.left,
            top: `${20 + (h.id % 4) * 20}%`,
            animationDelay: h.delay,
            animationDuration: h.duration,
            width: h.size,
            height: h.size,
          }}
          fill="currentColor"
        />
      ))}
    </div>
  );
};

export default FloatingHearts;
