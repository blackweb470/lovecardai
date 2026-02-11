import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { MOODS } from "@/lib/cardTypes";
import { generateAIMessage } from "@/lib/cardApi";
import { toast } from "sonner";

interface AIGeneratorProps {
  recipientName: string;
  onGenerated: (message: string) => void;
}

const AIGenerator = ({ recipientName, onGenerated }: AIGeneratorProps) => {
  const [mood, setMood] = useState(MOODS[0].value);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!recipientName.trim()) {
      toast.error("Enter a recipient name first!");
      return;
    }
    setLoading(true);
    try {
      const message = await generateAIMessage(recipientName, mood);
      onGenerated(message);
      toast.success("AI generated a card message! ✨");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-semibold">AI Card Writer</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMood(m.value)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              mood === m.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </>
        )}
      </button>
    </div>
  );
};

export default AIGenerator;
