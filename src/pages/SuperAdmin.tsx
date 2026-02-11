import { useState } from "react";
import { Shield, Loader2, Save, Eye, EyeOff, Settings, ArrowLeft } from "lucide-react";
import { adminAuth } from "@/lib/cardApi";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import FloatingHearts from "@/components/FloatingHearts";

const SuperAdmin = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [waToken, setWaToken] = useState("");
  const [waInstanceId, setWaInstanceId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Enter the admin password");
      return;
    }

    setLoading(true);
    try {
      const result = await adminAuth(password, "get_settings");
      setAuthenticated(true);
      setWaToken(result.settings?.ultramsg_token || "");
      setWaInstanceId(result.settings?.ultramsg_instance_id || "");
      toast.success("Welcome, admin! 🔐");
    } catch {
      toast.error("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAuth(password, "save_settings", {
        ultramsg_token: waToken,
        ultramsg_instance_id: waInstanceId,
      });
      toast.success("Settings saved! ✅");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
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
          Home
        </Link>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Super Admin
          </h1>
        </div>
        <p className="text-muted-foreground">
          Configure API connections & settings
        </p>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {!authenticated ? (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm animate-fade-in-up">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              🔐 Admin Access
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Enter the admin password to access settings.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password..."
                className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Access Settings
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in-up">
            {/* WhatsApp Business API */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-display text-xl font-semibold text-foreground">
                Ultramsg WhatsApp API
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Connect your Ultramsg account to send cards directly to recipients via WhatsApp.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Ultramsg Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={waToken}
                      onChange={(e) => setWaToken(e.target.value)}
                      placeholder="Your Ultramsg token..."
                      className="w-full rounded-lg border border-input bg-card px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Instance ID
                  </label>
                  <input
                    type="text"
                    value={waInstanceId}
                    onChange={(e) => setWaInstanceId(e.target.value)}
                    placeholder="instanceXXXXX..."
                    className="w-full rounded-lg border border-input bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>How to get these:</strong><br />
                    1. Go to{" "}
                    <a
                      href="https://ultramsg.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      ultramsg.com
                    </a><br />
                    2. Sign up and create an instance<br />
                    3. Scan the QR code with your WhatsApp<br />
                    4. Copy the Instance ID & Token from your dashboard
                  </p>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${waToken && waInstanceId ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                <span className="text-sm text-foreground">
                  Ultramsg: {waToken && waInstanceId ? "Connected ✅" : "Not configured"}
                </span>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdmin;
