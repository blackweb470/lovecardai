import { useState } from "react";
import { Heart, Loader2, Copy, Check, MessageCircle, Mail, Link as LinkIcon, Send } from "lucide-react";
import { createSection, getSectionShareUrl, getSectionAdminUrl, getWhatsAppShareUrl, getEmailShareUrl } from "@/lib/cardApi";
import FloatingHearts from "@/components/FloatingHearts";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Home = () => {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ slug: string; adminToken: string; name: string } | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter a name for your section!");
      return;
    }

    setCreating(true);
    try {
      const section = await createSection(name.trim());
      setResult({ slug: section.slug, adminToken: section.admin_token, name: section.name });
      toast.success("Your anonymous link is ready! 🎉");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create section");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, type: "public" | "admin") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "public") {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      } else {
        setCopiedAdmin(true);
        setTimeout(() => setCopiedAdmin(false), 2000);
      }
      toast.success("Copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: "var(--gradient-hero)" }}>
      <FloatingHearts />

      <header className="relative z-10 pt-16 pb-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-10 h-10 text-primary" fill="currentColor" />
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground tracking-tight">
            Val Cards
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Create your anonymous link. Share it with your group.
          <br />
         <span className="text-primary font-medium">Only you</span> can see the messages people send. 💌
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link
            to="/direct"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Send Direct Card
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {!result ? (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm animate-fade-in-up">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Create your anonymous box 📦
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Give it a name (your name, class, team — anything!)
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah's Val Box, Class 10A, Marketing Team..."
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                maxLength={60}
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Create My Link
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            {/* Success */}
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                Your link is ready!
              </h2>
              <p className="text-muted-foreground text-sm">
                Share the link below with your friends, class, or team
              </p>
            </div>

            {/* Public link */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                📤 Share this link
              </h3>
              <p className="text-muted-foreground text-xs mb-3">
                Anyone with this link can send you anonymous cards
              </p>
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
                <code className="text-sm text-foreground flex-1 truncate">
                  {getSectionShareUrl(result.slug)}
                </code>
                <button
                  onClick={() => copyToClipboard(getSectionShareUrl(result.slug), "public")}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                >
                  {copiedPublic ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href={getWhatsAppShareUrl(result.slug, result.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={getEmailShareUrl(result.slug, result.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            </div>

            {/* Admin link */}
            <div className="bg-card rounded-2xl border border-primary/20 p-6 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                🔐 Your secret admin link
              </h3>
              <p className="text-muted-foreground text-xs mb-3">
                <strong>Bookmark this!</strong> Only you can see messages with this link.
              </p>
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <code className="text-xs text-foreground flex-1 truncate">
                  {getSectionAdminUrl(result.slug, result.adminToken)}
                </code>
                <button
                  onClick={() => copyToClipboard(getSectionAdminUrl(result.slug, result.adminToken), "admin")}
                  className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                >
                  {copiedAdmin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-destructive text-xs mt-2 italic">
                ⚠️ Don't share this link — anyone with it can see all your messages!
              </p>
            </div>

            {/* Create another */}
            <button
              onClick={() => {
                setResult(null);
                setName("");
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-foreground font-medium hover:bg-secondary transition-all"
            >
              <LinkIcon className="w-4 h-4" />
              Create another link
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
