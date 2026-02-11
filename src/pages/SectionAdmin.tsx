import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft, Copy, Check, MessageCircle, Mail, RefreshCw, Lock } from "lucide-react";
import { fetchSectionCards, getSectionShareUrl, getWhatsAppShareUrl, getEmailShareUrl } from "@/lib/cardApi";
import ValCardDisplay from "@/components/ValCardDisplay";
import FloatingHearts from "@/components/FloatingHearts";
import { toast } from "sonner";
import { useState } from "react";

const SectionAdmin = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["section-cards", slug, token],
    queryFn: () => fetchSectionCards(slug!, token!),
    enabled: !!slug && !!token,
    refetchInterval: 10000,
  });

  const handleCopy = async () => {
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(getSectionShareUrl(slug));
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-center p-8 animate-fade-in-up">
          <Lock className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            Access denied
          </h2>
          <p className="text-muted-foreground mb-6">
            You need the admin link to view messages.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: "var(--gradient-hero)" }}>
      <FloatingHearts />

      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Val Cards
          </h1>
        </div>
        {data?.section && (
          <p className="text-primary font-display text-xl font-semibold">
            {data.section.name}'s Messages 🔐
          </p>
        )}
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading your messages...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 animate-fade-in-up">
            <Lock className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Invalid admin link
            </h2>
            <p className="text-muted-foreground mb-6">
              This admin link is invalid or expired.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg"
            >
              Go home
            </Link>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            {/* Share section */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <p className="text-sm text-muted-foreground mb-3">
                Share your link to receive more anonymous cards:
              </p>
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-2.5">
                <code className="text-sm text-foreground flex-1 truncate">
                  {slug && getSectionShareUrl(slug)}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <a
                  href={slug ? getWhatsAppShareUrl(slug, data?.section.name || "") : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
                <a
                  href={slug ? getEmailShareUrl(slug, data?.section.name || "") : "#"}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              </div>
            </div>

            {/* Cards */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Messages ({data?.cards.length || 0})
              </h2>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {data?.cards.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No messages yet!
                </h3>
                <p className="text-muted-foreground">
                  Share your link and wait for the love to roll in 💕
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data?.cards.map((card) => (
                  <ValCardDisplay key={card.id} card={card} showShare={false} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SectionAdmin;
