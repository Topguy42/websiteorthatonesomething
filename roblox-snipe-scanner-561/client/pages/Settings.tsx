import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Webhook,
  Clock,
  Volume2,
  Eye,
  Trash2,
  Plus,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPreference {
  id: string;
  type: "email" | "discord" | "sound";
  enabled: boolean;
  threshold?: number; // min profit margin for alerts
  destination?: string; // email or webhook URL
}

interface WebhookDestination {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: string;
}

const notificationTypes = [
  {
    id: "sound",
    name: "Sound Alerts",
    icon: Volume2,
    description: "Play a notification sound when hot deals appear",
  },
  {
    id: "visual",
    name: "Visual Indicators",
    icon: Eye,
    description: "Highlight new deals with glowing badges",
  },
  {
    id: "discord",
    name: "Discord Webhooks",
    icon: Webhook,
    description: "Send deal notifications to your Discord server",
  },
];

export default function Settings() {
  const [refreshInterval, setRefreshInterval] = useState(45);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([
    {
      id: "sound",
      type: "sound",
      enabled: true,
      threshold: 150,
    },
    {
      id: "visual",
      type: "email",
      enabled: true,
      threshold: 100,
    },
  ]);
  const [webhooks, setWebhooks] = useState<WebhookDestination[]>([]);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<WebhookDestination | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("snipez-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRefreshInterval(parsed.refreshInterval ?? 45);
        setNotificationPrefs(parsed.notificationPrefs ?? notificationPrefs);
        setWebhooks(parsed.webhooks ?? []);
      } catch {
        // Use defaults
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "snipez-settings",
      JSON.stringify({
        refreshInterval,
        notificationPrefs,
        webhooks,
      })
    );
  }, [refreshInterval, notificationPrefs, webhooks]);

  const handleAddWebhook = () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    // Basic URL validation
    if (!webhookForm.url.startsWith("http")) {
      toast.error("Invalid webhook URL");
      return;
    }

    const newWebhook: WebhookDestination = {
      id: Date.now().toString(),
      name: webhookForm.name,
      url: webhookForm.url,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    setWebhooks([...webhooks, newWebhook]);
    setWebhookForm({ name: "", url: "" });
    setIsWebhookDialogOpen(false);
    toast.success("Webhook added successfully");
  };

  const handleDeleteWebhook = (webhook: WebhookDestination) => {
    setWebhookToDelete(webhook);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (webhookToDelete) {
      setWebhooks(webhooks.filter((w) => w.id !== webhookToDelete.id));
      toast.success("Webhook removed");
    }
    setIsDeleteDialogOpen(false);
    setWebhookToDelete(null);
  };

  const toggleWebhook = (id: string) => {
    setWebhooks(
      webhooks.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const toggleNotification = (id: string) => {
    setNotificationPrefs(
      notificationPrefs.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">
            Configuration
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Operator Settings
          </h1>
          <p className="mt-4 text-muted-foreground">
            Fine-tune refresh cadence, enable notifications, and integrate with external
            services like Discord webhooks for real-time deal alerts.
          </p>
        </div>
      </section>

      {/* Refresh Interval */}
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Scan Refresh Cadence</h2>
            <p className="text-sm text-muted-foreground">
              How often should the marketplace scan update the deal feed
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium text-foreground">Refresh interval (seconds)</label>
              <span className="text-primary">{refreshInterval}s</span>
            </div>
            <input
              type="range"
              min={15}
              max={300}
              step={5}
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
            />
            <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <span>15s (aggressive)</span>
              <span className="text-center">60s (moderate)</span>
              <span className="text-right">180s (relaxed)</span>
              <span className="text-right">300s (minimal)</span>
            </div>
          </div>

          <div className="flex gap-3 rounded-[24px] border border-primary/25 bg-primary/5 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-sm text-foreground">
              <p className="font-medium">Faster refreshes = faster deals, higher server load</p>
              <p className="mt-1 text-muted-foreground">
                15-30 second intervals are ideal for competitive hunting; use 60+ seconds for
                relaxed scanning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Configure how you receive alerts when hot deals are detected
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {notificationPrefs.map((pref, idx) => (
            <motion.div
              key={pref.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between rounded-[24px] border border-white/10 bg-background/60 p-4"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  {pref.type === "sound" && "Sound Alerts"}
                  {pref.type === "email" && "Visual Indicators"}
                  {pref.type === "discord" && "Discord Notifications"}
                </p>
                {pref.threshold && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Alert when margin exceeds {pref.threshold}%
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleNotification(pref.id)}
                className={`relative h-8 w-14 rounded-full transition-colors ${
                  pref.enabled ? "bg-primary" : "bg-white/10"
                }`}
              >
                <motion.div
                  className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white"
                  animate={{ x: pref.enabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Discord Webhooks */}
      <section className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Discord Webhooks</h2>
              <p className="text-sm text-muted-foreground">
                Push real-time deal notifications to your Discord server
              </p>
            </div>
          </div>

          <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[28px] border-white/10 bg-card/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Add Discord Webhook</DialogTitle>
                <DialogDescription>
                  Get your webhook URL from Discord server settings → Integrations → Webhooks
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Webhook Name
                  </label>
                  <input
                    type="text"
                    value={webhookForm.name}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, name: e.target.value })
                    }
                    placeholder="e.g., #trading-alerts"
                    className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Webhook URL
                  </label>
                  <input
                    type="password"
                    value={webhookForm.url}
                    onChange={(e) =>
                      setWebhookForm({ ...webhookForm, url: e.target.value })
                    }
                    placeholder="https://discord.com/api/webhooks/..."
                    className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-primary/40"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsWebhookDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl bg-primary"
                    onClick={handleAddWebhook}
                  >
                    Add Webhook
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {webhooks.length > 0 ? (
          <div className="mt-6 space-y-3">
            {webhooks.map((webhook) => (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-[24px] border border-white/10 bg-background/60 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{webhook.name}</p>
                    {webhook.enabled ? (
                      <Badge variant="outline" className="rounded-full text-xs bg-primary/10 text-primary border-primary/25">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full text-xs">
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs text-muted-foreground font-mono">
                    {webhook.url}
                    <button
                      onClick={() => copyToClipboard(webhook.url, webhook.id)}
                      className="flex-shrink-0 rounded p-1 hover:bg-white/10"
                    >
                      {copiedId === webhook.id ? (
                        <CheckCircle className="h-3 w-3 text-primary" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWebhook(webhook.id)}
                    className={`relative h-8 w-14 rounded-full transition-colors ${
                      webhook.enabled ? "bg-primary" : "bg-white/10"
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 h-6 w-6 rounded-full bg-white"
                      animate={{ x: webhook.enabled ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  </button>

                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <button
                      onClick={() => handleDeleteWebhook(webhook)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialog>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-background/50 p-8 text-center">
            <Webhook className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No webhooks configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first Discord webhook to receive real-time deal alerts
            </p>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="rounded-[28px] border border-white/10 bg-card/50 p-6 backdrop-blur-xl">
        <h3 className="font-display text-lg font-semibold">Setup Guide</h3>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Discord Webhook Setup:</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 ml-2">
              <li>Open your Discord server settings</li>
              <li>Go to Integrations → Webhooks</li>
              <li>Create a new webhook and select the target channel</li>
              <li>Copy the webhook URL and paste it here</li>
              <li>Snipes will now post to that channel automatically</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[28px] border-white/10 bg-card/95 backdrop-blur-xl">
          <AlertDialogTitle>Remove Webhook?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove "{webhookToDelete?.name}"? You won't receive alerts to that channel anymore.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
