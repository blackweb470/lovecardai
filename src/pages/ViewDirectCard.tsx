import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft, Send, Loader2, Download } from "lucide-react";
import { fetchDirectCard, sendReply } from "@/lib/cardApi";
import { STYLE_CLASSES, EMOJIS } from "@/lib/cardTypes";
import FloatingHearts from "@/components/FloatingHearts";
import { toast } from "sonner";

const ViewDirectCard = () => {
  const { token } = useParams<{ token: string }>();
  const [replyMessage, setReplyMessage] = useState("");
  const [replyEmoji, setReplyEmoji] = useState("💖");
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState(false);

  const { data: card, isLoading, error } = useQuery({
    queryKey: ["direct-card", token],
    queryFn: () => fetchDirectCard(token!),
    enabled: !!token,
  });

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Write a reply message!");
      return;
    }
    setSending(true);
    try {
      await sendReply(token!, replyMessage.trim(), replyEmoji);
      setReplySent(true);
      toast.success("Reply sent anonymously! 💌");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleDownloadMedia = async () => {
    if (!card?.media_url) return;
    try {
      const response = await fetch(card.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kindred-card-${card.media_type === "video" ? "video.mp4" : "image.jpg"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download media");
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "var(--gradient-hero)" }}>
      <FloatingHearts />

      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Create your own
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            You got a Val Card!
          </h1>
        </div>
        <p className="text-muted-foreground">
          Someone sent you something special 💕
        </p>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Opening your card...</p>
          </div>
        ) : error || !card ? (
          <div className="text-center py-20 animate-fade-in-up">
            <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Card not found
            </h2>
            <p className="text-muted-foreground mb-6">
              This card link may be invalid or no longer exists.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg"
            >
              Create your own
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in-up space-y-6">
            <div
              className={`${STYLE_CLASSES[card.style] || STYLE_CLASSES[0]} rounded-2xl p-8 text-white shadow-xl`}
            >
              <span className="text-5xl mb-4 block">{card.emoji}</span>
              <p className="font-display text-2xl font-semibold mb-4">
                To: {card.recipient_name}
              </p>
              <p className="opacity-90 text-base leading-relaxed whitespace-pre-wrap">
                {card.message}
              </p>

              {card.media_url && (
                <div className="mt-4 rounded-xl overflow-hidden relative group">
                  {card.media_type === "video" ? (
                    <video src={card.media_url} controls className="w-full max-h-64 object-cover" />
                  ) : (
                    <img src={card.media_url} alt="Card media" className="w-full max-h-64 object-cover" />
                  )}
                  <button
                    onClick={handleDownloadMedia}
                    className="absolute top-2 right-2 p-2.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all shadow-md active:scale-95 z-20"
                    title="Download Media"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              )}

              <p className="mt-6 text-sm opacity-60 italic">
                — sent anonymously 💌
              </p>
            </div>

            {/* Reply section - only show if sender enabled replies */}
            {card.can_reply && !replySent && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  💬 Reply anonymously
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Send a reply — they won't see your contact details
                </p>

                <div className="space-y-4">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Write your reply..."
                    rows={3}
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right -mt-2">{replyMessage.length}/300</p>

                  <div className="flex flex-wrap gap-1.5">
                    {EMOJIS.slice(0, 8).map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setReplyEmoji(e)}
                        className={`text-xl p-1.5 rounded-lg transition-all ${replyEmoji === e
                          ? "bg-secondary scale-110 ring-1 ring-primary/30"
                          : "hover:bg-secondary/50"
                          }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleReply}
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply Anonymously
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {replySent && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-center animate-fade-in-up">
                <div className="text-4xl mb-3">💌</div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Reply sent!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your anonymous reply has been delivered 💕
                </p>
              </div>
            )}

            <div className="text-center">
              <Link
                to="/direct"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                <Heart className="w-4 h-4" />
                Send one back
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewDirectCard;
