import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, ArrowLeft, Send, Loader2, Download, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { fetchDirectCard, sendReply } from "@/lib/cardApi";
import { STYLE_CLASSES, EMOJIS } from "@/lib/cardTypes";
import FloatingHearts from "@/components/FloatingHearts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const PAYSTACK_PUBLIC_KEY = "pk_live_94c4d826d01caa8b77de76c34f139e4821d7ae52";


const ViewDirectCard = () => {
  const { token } = useParams<{ token: string }>();
  const [replyMessage, setReplyMessage] = useState("");
  const [replyEmoji, setReplyEmoji] = useState("💖");
  const [sending, setSending] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingVideo, setDownloadingVideo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const { data: card, isLoading, error } = useQuery({
    queryKey: ["direct-card", token],
    queryFn: () => fetchDirectCard(token!),
    enabled: !!token,
  });

  const actualReply = useCallback(async () => {
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
  }, [token, replyMessage, replyEmoji]);

  const handleInitiateReply = () => {
    if (!replyMessage.trim()) {
      toast.error("Write a reply message!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    setInitializingPayment(true);

    if (!paystackLoaded) {
      toast.warning("Payment gateway still loading... please wait.");
      if (!(window as any).PaystackPop) {
        setInitializingPayment(false);
        return;
      }
    }

    // For replies, we need an email - use card recipient email if available, or require user to provide
    const email = card?.recipient_email || "reply@valcards.app";

    try {
      // Generate a cryptographically strong unique reference
      const uniqueRef = `vc_reply_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

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
              display_name: "Transaction Type",
              variable_name: "transaction_type",
              value: "Reply to Valentine Card"
            },
            {
              display_name: "Original Card Recipient",
              variable_name: "original_recipient",
              value: card?.recipient_name || "Unknown"
            },
            {
              display_name: "Reply Emoji",
              variable_name: "reply_emoji",
              value: replyEmoji
            },
            {
              display_name: "Service Type",
              variable_name: "service_type",
              value: "Anonymous Reply Card"
            }
          ],
          original_card_id: card?.id,
          transaction_type: "valentine_reply",
          platform: "web",
          timestamp: new Date().toISOString()
        },
        callback: (response: any) => {
          setInitializingPayment(false); // Stop loading on success callback

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
              await actualReply();
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

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    toast.loading("Preparing your card image...");

    try {
      // Small delay to ensure all assets are loaded after a refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2, // Higher quality
      });

      const link = document.createElement('a');
      link.download = `val-card-${card?.recipient_name || 'anonymous'}.png`;
      link.href = dataUrl;
      link.click();
      toast.dismiss();
      toast.success("Card downloaded successfully! 📸");
    } catch (err) {
      console.error('Failed to download card:', err);
      toast.dismiss();
      toast.error("Failed to download card image");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!videoRef.current || !cardRef.current) return;

    setDownloadingVideo(true);
    const toastId = toast.loading("Preparing your card video... This may take a moment.");

    try {
      const video = videoRef.current;
      const card = cardRef.current;

      // Ensure video is loaded and ready
      if (video.readyState < 2) {
        await new Promise(resolve => {
          video.oncanplay = resolve;
        });
      }

      // Calculate video position relative to card
      const videoRect = video.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const relativeX = videoRect.left - cardRect.left;
      const relativeY = videoRect.top - cardRect.top;
      const relativeWidth = videoRect.width;
      const relativeHeight = videoRect.height;

      // 1. Capture the overlay (text, styles, etc.) without the video
      const originalVideoOpacity = video.style.opacity;
      video.style.opacity = '0';

      const overlayCanvas = await html2canvas(card, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        scale: 2,
      });
      video.style.opacity = originalVideoOpacity;

      // 2. Prepare canvas for compositing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Failed to get canvas context");

      // Use a standard portrait/landscape aspect ratio based on card or video
      // Let's use the overlay capture size as the base
      canvas.width = overlayCanvas.width;
      canvas.height = overlayCanvas.height;

      // 3. Setup MediaRecorder with Audio
      const canvasStream = canvas.captureStream(30);

      // Try to get audio from video
      let finalStream = canvasStream;
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination); // Also play to user

        const audioTracks = destination.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          finalStream = new MediaStream([...canvasStream.getTracks(), ...audioTracks]);
        }
      } catch (audioErr) {
        console.warn("Could not capture audio:", audioErr);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        bitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      return new Promise<void>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `val-card-${card?.id || Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          toast.dismiss(toastId);
          toast.success("Video downloaded successfully! 🎬");
          setDownloadingVideo(false);
        };

        mediaRecorder.onerror = (e) => {
          console.error("MediaRecorder error:", e);
          reject(e);
        };

        // 4. Start recording and play video
        const originalTime = video.currentTime;
        video.currentTime = 0;

        mediaRecorder.start();

        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw card overlay first (including background)
          ctx.drawImage(overlayCanvas, 0, 0);

          // Draw video frame on top of its placeholder
          // Scale relative coordinates to canvas scale (which is 2x based on html2canvas scale: 2)
          ctx.drawImage(
            video,
            relativeX * 2,
            relativeY * 2,
            relativeWidth * 2,
            relativeHeight * 2
          );

          requestAnimationFrame(drawFrame);
        };

        video.play().then(() => {
          drawFrame();
        }).catch(err => {
          console.error("Video play failed:", err);
          mediaRecorder.stop();
          reject(err);
        });
      });

    } catch (err) {
      console.error('Failed to download card video:', err);
      toast.dismiss(toastId);
      toast.error("Failed to generate card video");
      setDownloadingVideo(false);
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
              ref={cardRef}
              className={`${STYLE_CLASSES[card.style] || STYLE_CLASSES[0]} rounded-2xl p-8 text-white shadow-xl relative overflow-hidden`}
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
                    <video
                      ref={videoRef}
                      src={card.media_url}
                      controls
                      playsInline
                      crossOrigin="anonymous"
                      className="w-full max-h-64 object-cover"
                    />
                  ) : (
                    <img src={card.media_url} alt="Card media" crossOrigin="anonymous" className="w-full max-h-64 object-cover" />
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

            <button
              onClick={handleDownloadCard}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 font-semibold text-secondary-foreground shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Download Card as Image
                </>
              )}
            </button>

            {card.media_type === "video" && (
              <button
                onClick={handleDownloadVideo}
                disabled={downloadingVideo}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {downloadingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording Video...
                  </>
                ) : (
                  <>
                    <VideoIcon className="w-4 h-4" />
                    Download Card as Video
                  </>
                )}
              </button>
            )}

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
                    onClick={handleInitiateReply}
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

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reply Payment</DialogTitle>
            <DialogDescription>
              Sending a reply costs ₦100. It will be sent anonymously.
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
    </div>
  );
};

export default ViewDirectCard;
