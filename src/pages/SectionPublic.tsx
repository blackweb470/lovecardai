import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft } from "lucide-react";
import { fetchSectionBySlug } from "@/lib/cardApi";
import CreateCardForm from "@/components/CreateCardForm";
import FloatingHearts from "@/components/FloatingHearts";

const SectionPublic = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: section, isLoading, error } = useQuery({
    queryKey: ["section", slug],
    queryFn: () => fetchSectionBySlug(slug!),
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen relative" style={{ background: "var(--gradient-hero)" }}>
      <FloatingHearts />

      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Create your own link
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Val Cards
          </h1>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error || !section ? (
          <div className="text-center py-20 animate-fade-in-up">
            <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              Link not found
            </h2>
            <p className="text-muted-foreground mb-6">
              This link may be invalid or no longer exists.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
            >
              Create your own link
            </Link>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
                Send an anonymous card to
              </h2>
              <p className="text-primary font-display text-xl font-semibold mb-6">
                {section.name} 💌
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                It's completely anonymous — they won't know who sent it!
              </p>

              <CreateCardForm
                sectionId={section.id}
                onCreated={() => {}}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SectionPublic;
