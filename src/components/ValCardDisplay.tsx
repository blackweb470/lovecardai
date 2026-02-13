import { ValCard, STYLE_CLASSES } from "@/lib/cardTypes";

interface ValCardDisplayProps {
  card: ValCard;
  showShare?: boolean;
}

const ValCardDisplay = ({ card, showShare = false }: ValCardDisplayProps) => {
  return (
    <div
      className={`${STYLE_CLASSES[card.style] || STYLE_CLASSES[0]} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up`}
    >
      <span className="text-3xl mb-2 block">{card.emoji}</span>
      <p className="font-display text-lg font-semibold">To: {card.recipient_name}</p>
      <p className="mt-2 opacity-90 text-sm leading-relaxed">{card.message}</p>

      {card.media_url && (
        <div className="mt-3 rounded-xl overflow-hidden">
          {card.media_type === "video" ? (
            <video
              src={card.media_url}
              controls
              className="w-full max-h-48 object-cover"
            />
          ) : (
            <img
              src={card.media_url}
              alt="Card media"
              crossOrigin="anonymous"
              className="w-full max-h-48 object-cover"
            />
          )}
        </div>
      )}

      <p className="mt-4 text-xs opacity-60 italic">
        — sent anonymously 💌
      </p>
    </div>
  );
};

export default ValCardDisplay;
