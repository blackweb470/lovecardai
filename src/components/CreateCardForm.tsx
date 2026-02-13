import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { STYLE_CLASSES, EMOJIS } from "@/lib/cardTypes";
import { createCard, uploadMedia } from "@/lib/cardApi";
import MediaUpload from "@/components/MediaUpload";
import AIGenerator from "@/components/AIGenerator";
import { toast } from "sonner";

interface CreateCardFormProps {
  sectionId: string;
  onCreated: () => void;
}

const CreateCardForm = ({ sectionId, onCreated }: CreateCardFormProps) => {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState(0);
  const [emoji, setEmoji] = useState("💖");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Word count utility
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordLimit = isAiGenerated ? 300 : 1000;
  const currentWordCount = getWordCount(message);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !message.trim()) {
      toast.error("Please fill in the recipient and message!");
      return;
    }

    setSubmitting(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (mediaFile) {
        const result = await uploadMedia(mediaFile);
        media_url = result.url;
        media_type = result.type;
      }

      await createCard({
        recipient_name: to.trim(),
        message: message.trim(),
        style,
        emoji,
        media_url,
        media_type,
        is_ai_generated: isAiGenerated,
        section_id: sectionId,
      });

      toast.success("Your anonymous card has been sent! 💌");
      setSent(true);
      onCreated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send card");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTo("");
    setMessage("");
    setStyle(0);
    setEmoji("💖");
    setMediaFile(null);
    setMediaPreview(null);
    setSent(false);
    setIsAiGenerated(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8 animate-fade-in-up">
        <div className="text-5xl mb-4">💌</div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Card sent anonymously!
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          They'll never know who sent it 😏
        </p>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
        >
          Send another card
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up">
      {/* Recipient */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">To</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient's name..."
          className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          maxLength={50}
        />
      </div>

      {/* AI Generator */}
      <AIGenerator
        recipientName={to}
        onGenerated={(msg) => {
          setMessage(msg);
          setIsAiGenerated(true);
        }}
      />

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Your message
        </label>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            // If the user starts typing manually after AI generation, we still consider the start AI but if it diverges significantly we might want to reset? 
            // For now, let's say if they type, it's human unless it was JUST generated.
            // Actually, let's keep it simple: if you edit it, it's human written.
            setIsAiGenerated(false);
          }}
          placeholder="Write something kind, funny, spicy, or heartfelt..."
          rows={4}
          className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">
            {isAiGenerated ? "✨ AI Generated (300 words max)" : "✍️ Human Written (1000 words max)"}
          </p>
          <p className={`text-xs ${currentWordCount > wordLimit ? "text-destructive font-bold" : "text-muted-foreground"}`}>
            {currentWordCount}/{wordLimit} words
          </p>
        </div>
      </div>

      {/* Media upload */}
      <MediaUpload
        mediaFile={mediaFile}
        mediaPreview={mediaPreview}
        onFileSelect={(file, preview) => {
          setMediaFile(file);
          setMediaPreview(preview);
        }}
      />

      {/* Card style */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Card style</label>
        <div className="flex flex-wrap gap-3">
          {STYLE_CLASSES.map((cls, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStyle(i)}
              className={`h-12 w-12 rounded-xl ${cls} transition-all ${style === i
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                  : "opacity-70 hover:opacity-100"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Pick an emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-2xl p-2 rounded-lg transition-all ${emoji === e
                  ? "bg-secondary scale-110 ring-1 ring-primary/30"
                  : "hover:bg-secondary/50"
                }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Preview</label>
        <div className={`${STYLE_CLASSES[style]} rounded-2xl p-6 text-white shadow-lg`}>
          <span className="text-3xl mb-2 block">{emoji}</span>
          <p className="font-display text-lg font-semibold">To: {to || "..."}</p>
          <p className="mt-2 opacity-90 text-sm leading-relaxed">{message || "Your message here..."}</p>
          {mediaPreview && (
            <div className="mt-3 rounded-xl overflow-hidden">
              {mediaFile?.type.startsWith("video") ? (
                <video src={mediaPreview} controls className="w-full max-h-32 object-cover" />
              ) : (
                <img src={mediaPreview} alt="Attached" className="w-full max-h-32 object-cover" />
              )}
            </div>
          )}
          <p className="mt-4 text-xs opacity-60 italic">— sent anonymously 💌</p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Anonymously
          </>
        )}
      </button>
    </form>
  );
};

export default CreateCardForm;
