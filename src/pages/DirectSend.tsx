import { useState, useCallback, useEffect } from "react";
import { Heart, Send, Loader2, ArrowLeft, MessageCircle, Mail, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STYLE_CLASSES, EMOJIS, MOODS } from "@/lib/cardTypes";
import { sendDirectCard, uploadMedia, generateAIMessage, getDirectCardWhatsAppUrl, getDirectCardEmailUrl, getDirectCardViewUrl } from "@/lib/cardApi";
import MediaUpload from "@/components/MediaUpload";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import FloatingHearts from "@/components/FloatingHearts";
import { supabase } from "@/integrations/supabase/client";

const PAYSTACK_PUBLIC_KEY = "pk_live_94c4d826d01caa8b77de76c34f139e4821d7ae52";

const DirectSend = () => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [style, setStyle] = useState(0);
  const [emoji, setEmoji] = useState("💖");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    view_token: string;
    view_url: string;
    delivery: { whatsapp?: string; email?: string };
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // AI generator state
  const [selectedMood, setSelectedMood] = useState("");
  const [recipientGender, setRecipientGender] = useState("");
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Word count utility
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const wordLimit = isAiGenerated ? 300 : 1000;
  const currentWordCount = getWordCount(message);

  const handleGenerateAI = async () => {
    if (!recipientName.trim()) {
      toast.error("Enter the recipient's name first");
      return;
    }
    if (!selectedMood) {
      toast.error("Pick a mood!");
      return;
    }

    setGenerating(true);
    try {
      const msg = await generateAIMessage(recipientName.trim(), selectedMood, recipientGender);
      setMessage(msg);
      setIsAiGenerated(true);
      toast.success("Message generated! ✨");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  // Paystack & Script Loading State
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);

  // Preload Paystack script
  useEffect(() => {
    if ((window as any).PaystackPop) {
      setPaystackLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    script.onerror = () => toast.error("Failed to load payment gateway");
    document.body.appendChild(script);
  }, []);

  const actualSend = useCallback(async () => {
    setSubmitting(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | null = null;

      if (mediaFile) {
        const uploaded = await uploadMedia(mediaFile);
        media_url = uploaded.url;
        media_type = uploaded.type;
      }

      const res = await sendDirectCard({
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim() || undefined,
        recipient_email: recipientEmail.trim() || undefined,
        message: message.trim(),
        emoji,
        style,
        media_url,
        media_type,
        sender_phone: senderPhone.trim() || undefined,
        sender_email: senderEmail.trim() || undefined,
      });

      setResult({
        view_token: res.view_token,
        view_url: res.view_url,
        delivery: res.delivery,
      });
      toast.success("Card sent! 💌");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }, [recipientName, recipientPhone, recipientEmail, message, emoji, style, mediaFile, senderPhone, senderEmail]);

  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !message.trim()) {
      toast.error("Fill in the name and message!");
      return;
    }
    if (!recipientPhone.trim() && !recipientEmail.trim()) {
      toast.error("Enter a phone number or email to send the card!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    setInitializingPayment(true);

    if (!paystackLoaded) {
      toast.warning("Payment gateway still loading... please wait.");
      // Try verify again
      if (!(window as any).PaystackPop) {
        setInitializingPayment(false);
        return;
      }
    }

    // Require a real email - no fallback to prevent fraud detection
    const email = recipientEmail.trim() || senderEmail.trim();
    if (!email) {
      toast.error("Please provide an email address for payment verification");
      setInitializingPayment(false);
      setIsConfirmOpen(true);
      return;
    }

    try {
      // Generate a cryptographically strong unique reference
      const uniqueRef = `vc_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

      const handler = (window as any).PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: 10000, // ₦100 in kobo
        currency: "NGN",
        ref: uniqueRef,
        // Add metadata to help with fraud detection
        metadata: {
          custom_fields: [
            {
              display_name: "Recipient Name",
              variable_name: "recipient_name",
              value: recipientName.trim()
            },
            {
              display_name: "Service Type",
              variable_name: "service_type",
              value: "Anonymous Valentine Card"
            },
            {
              display_name: "Card Style",
              variable_name: "card_style",
              value: `Style ${style}`
            },
            {
              display_name: "Has Media",
              variable_name: "has_media",
              value: mediaFile ? "Yes" : "No"
            }
          ],
          recipient_name: recipientName.trim(),
          sender_contact: senderPhone.trim() || senderEmail.trim() || "anonymous",
          transaction_type: "valentine_card",
          platform: "web",
          timestamp: new Date().toISOString()
        },
        callback: (response: any) => {
          setInitializingPayment(false); // Stop loading on success callback

          // Paystack doesn't support async callbacks, so we wrap async logic
          (async () => {
            toast.loading("Verifying payment...");
            try {
              const { data, error } = await supabase.functions.invoke("verify-payment", {
                body: { reference: response.reference },
              });

              if (error || !data?.verified) {
                toast.dismiss();
                toast.error("Payment verification failed");
                return;
              }
              toast.dismiss();
              await actualSend();
            } catch (error) {
              console.error(error);
              toast.dismiss();
              toast.error("Payment verification failed");
            }
          })();
        },
        onClose: () => {
          setInitializingPayment(false); // Stop loading on close
          toast.info("Payment cancelled");
        },
      });

      // Close dialog before opening Paystack iframe to prevent UI interference
      setIsConfirmOpen(false);
      handler.openIframe();

    } catch (error) {
      console.error("Paystack error:", error);
      toast.error("Could not initialize payment");
      setInitializingPayment(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(getDirectCardViewUrl(result.view_token));
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const resetForm = () => {
    setRecipientName("");
    setRecipientPhone("");
    setRecipientEmail("");
    setSenderPhone("");
    setSenderEmail("");
    setMessage("");
    setStyle(0);
    setEmoji("💖");
    setMediaFile(null);
    setMediaPreview(null);
    setResult(null);
    setSelectedMood("");
    setIsAiGenerated(false);
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
          Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Direct Card
          </h1>
        </div>
        <p className="text-muted-foreground">
          Send an anonymous card directly to someone special 💕
        </p>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {result ? (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm text-center">
              <div className="text-5xl mb-4">💌</div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                Card sent anonymously!
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                They'll never know who sent it 😏
              </p>

              {/* Delivery status */}
              <div className="space-y-2 mb-6">
                {result.delivery.whatsapp && (
                  <div className="flex items-center gap-2 justify-center text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      WhatsApp:{" "}
                      {result.delivery.whatsapp === "sent" ? (
                        <span className="text-accent font-medium">Delivered ✅</span>
                      ) : result.delivery.whatsapp?.startsWith("skipped") ? (
                        <span className="text-muted-foreground">API not configured</span>
                      ) : (
                        <span className="text-destructive">
                          {result.delivery.whatsapp}
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {result.delivery.email && (
                  <div className="flex items-center gap-2 justify-center text-sm">
                    <Mail className="w-4 h-4" />
                    <span>
                      Email:{" "}
                      {result.delivery.email === "sent" ? (
                        <span className="text-primary font-medium">Delivered ✅</span>
                      ) : result.delivery.email === "link_generated" ? (
                        <span className="text-muted-foreground">Link generated (not sent)</span>
                      ) : result.delivery.email?.startsWith("skipped") ? (
                        <span className="text-muted-foreground">API not configured</span>
                      ) : (
                        <span className="text-destructive">
                          {result.delivery.email}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Private link */}
              <div className="bg-secondary rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Share this private link with the recipient:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground flex-1 truncate">
                    {getDirectCardViewUrl(result.view_token)}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-primary-foreground text-sm font-medium hover:opacity-90"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Manual share buttons */}
              <div className="flex gap-2">
                {recipientPhone && (
                  <a
                    href={getDirectCardWhatsAppUrl(result.view_token, recipientName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground px-3 py-2 text-sm font-medium hover:opacity-90"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {recipientEmail && (
                  <a
                    href={getDirectCardEmailUrl(result.view_token, recipientName, recipientEmail)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-foreground font-medium hover:bg-secondary transition-all"
            >
              <Send className="w-4 h-4" />
              Send another card
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm animate-fade-in-up">
            <form onSubmit={handleInitiateSend} className="space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recipient's Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Their name..."
                  className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  maxLength={50}
                />
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    📱 WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="their@email.com"
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-4">
                Enter at least one — phone for WhatsApp delivery, email for email delivery
              </p>

              {/* Sender contact for replies */}
              <div className="border border-dashed border-border rounded-xl p-4">
                <label className="block text-sm font-medium text-foreground mb-1">
                  💬 Want to receive a reply? (optional)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Add your contact so they can reply anonymously — they won't see your details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Your WhatsApp</label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Your Email</label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* AI Mood Generator */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ✨ AI Message Generator
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setSelectedMood(m.value)}
                      className={`text-xs px-2.5 py-1.5 rounded-full transition-all ${selectedMood === m.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Gender Selection */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Gender (Optional)
                  </label>
                  <div className="flex gap-2">
                    {["Male", "Female", "Non-binary"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setRecipientGender(g === recipientGender ? "" : g)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${recipientGender === g
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-input hover:bg-secondary"
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating || !selectedMood}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Message ✨"
                  )}
                </button>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
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

              {/* Media */}
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
                  <p className="font-display text-lg font-semibold">To: {recipientName || "..."}</p>
                  <p className="mt-2 opacity-90 text-sm leading-relaxed">{message || "Your message here..."}</p>
                  {mediaPreview && (
                    <div className="mt-3 rounded-xl overflow-hidden">
                      {mediaFile?.type.startsWith("video") ? (
                        <video src={mediaPreview} controls playsInline className="w-full max-h-32 object-cover" />
                      ) : (
                        <img src={mediaPreview} alt="Attached" className="w-full max-h-32 object-cover" />
                      )}
                    </div>
                  )}
                  <p className="mt-4 text-xs opacity-60 italic">— sent anonymously 💌</p>
                </div>
              </div>

              {/* Submit */}
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
          </div>
        )}

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Payment</DialogTitle>
              <DialogDescription>
                You are about to send an anonymous card. A fee of ₦100 applies.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-lg font-medium">
                Total: ₦100
              </p>
            </div>
            <DialogFooter>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={initializingPayment}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {initializingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                Proceed to Pay
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default DirectSend;
