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
import { Trash2, Plus, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { SnipeCategory } from "@shared/api";

interface FilterPreset {
  id: string;
  name: string;
  minMargin: number;
  maxPrice: number;
  minDealScore: number;
  categories: SnipeCategory[];
  excludedCreators: string[];
  createdAt: string;
}

const categories: SnipeCategory[] = [
  "All",
  "Hat",
  "Hair",
  "Face",
  "Neck",
  "Shoulder",
  "Front",
  "Back",
  "Waist",
  "Accessory",
];

const defaultPresets: FilterPreset[] = [
  {
    id: "quick-flips",
    name: "Quick Flips",
    minMargin: 150,
    maxPrice: 300,
    minDealScore: 75,
    categories: ["All"],
    excludedCreators: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "budget-hunt",
    name: "Budget Hunt",
    minMargin: 80,
    maxPrice: 150,
    minDealScore: 50,
    categories: ["All"],
    excludedCreators: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "high-value",
    name: "High Value",
    minMargin: 300,
    maxPrice: 5000,
    minDealScore: 150,
    categories: ["All"],
    excludedCreators: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "accessories-only",
    name: "Accessories Only",
    minMargin: 100,
    maxPrice: 1000,
    minDealScore: 60,
    categories: ["Accessory"],
    excludedCreators: [],
    createdAt: new Date().toISOString(),
  },
];

export default function Filters() {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<FilterPreset | null>(null);
  const [formData, setFormData] = useState<FilterPreset>({
    id: "",
    name: "",
    minMargin: 80,
    maxPrice: 1200,
    minDealScore: 60,
    categories: ["All"],
    excludedCreators: [],
    createdAt: new Date().toISOString(),
  });
  const [creatorInput, setCreatorInput] = useState("");

  // Load presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("snipez-filter-presets");
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch {
        setPresets(defaultPresets);
      }
    } else {
      setPresets(defaultPresets);
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("snipez-filter-presets", JSON.stringify(presets));
  }, [presets]);

  const handleOpenDialog = (preset?: FilterPreset) => {
    if (preset) {
      setFormData(preset);
      setSelectedPreset(preset);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: "",
        minMargin: 80,
        maxPrice: 1200,
        minDealScore: 60,
        categories: ["All"],
        excludedCreators: [],
        createdAt: new Date().toISOString(),
      });
      setSelectedPreset(null);
    }
    setIsDialogOpen(true);
  };

  const handleSavePreset = () => {
    if (!formData.name.trim()) {
      toast.error("Preset name is required");
      return;
    }

    if (selectedPreset) {
      setPresets(presets.map((p) => (p.id === selectedPreset.id ? formData : p)));
      toast.success("Preset updated");
    } else {
      setPresets([...presets, formData]);
      toast.success("Preset created");
    }

    setIsDialogOpen(false);
  };

  const handleDeletePreset = (preset: FilterPreset) => {
    setPresetToDelete(preset);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (presetToDelete) {
      setPresets(presets.filter((p) => p.id !== presetToDelete.id));
      toast.success("Preset deleted");
    }
    setIsDeleteDialogOpen(false);
    setPresetToDelete(null);
  };

  const toggleCategory = (cat: SnipeCategory) => {
    if (cat === "All") {
      setFormData({
        ...formData,
        categories: formData.categories.includes("All") ? [] : ["All"],
      });
    } else {
      const newCategories = formData.categories.includes(cat)
        ? formData.categories.filter((c) => c !== cat)
        : [...formData.categories.filter((c) => c !== "All"), cat];
      setFormData({
        ...formData,
        categories: newCategories.length === 0 ? ["All"] : newCategories,
      });
    }
  };

  const addCreatorExclusion = () => {
    if (creatorInput.trim()) {
      setFormData({
        ...formData,
        excludedCreators: [
          ...formData.excludedCreators.filter((c) => c !== creatorInput.trim()),
          creatorInput.trim(),
        ],
      });
      setCreatorInput("");
    }
  };

  const removeCreatorExclusion = (creator: string) => {
    setFormData({
      ...formData,
      excludedCreators: formData.excludedCreators.filter((c) => c !== creator),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-[32px] border border-white/10 bg-card/80 p-8 shadow-glow backdrop-blur-xl">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.26em] text-muted-foreground">Advanced controls</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Deal Filter Presets</h1>
          <p className="mt-4 text-muted-foreground">
            Create and save custom filter configurations for different deal-hunting strategies. Switch between presets instantly to adapt to market conditions.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="mt-8 h-12 rounded-2xl bg-primary text-primary-foreground"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              New preset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-white/10 bg-card/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>{selectedPreset ? "Edit" : "Create"} Filter Preset</DialogTitle>
              <DialogDescription>
                Define custom criteria to identify your ideal deals
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Preset Name */}
              <div>
                <label className="block text-sm font-medium text-foreground">Preset Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hot Accessories Hunt"
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-primary/40"
                />
              </div>

              {/* Minimum Profit Margin */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <label className="font-medium text-foreground">Minimum Profit Margin</label>
                  <span className="text-primary">{Math.round(formData.minMargin)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={10}
                  value={formData.minMargin}
                  onChange={(e) =>
                    setFormData({ ...formData, minMargin: Number(e.target.value) })
                  }
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>500%</span>
                </div>
              </div>

              {/* Maximum Price */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Maximum Listing Price
                </label>
                <input
                  type="number"
                  min={25}
                  max={10000}
                  step={25}
                  value={formData.maxPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, maxPrice: Number(e.target.value) })
                  }
                  className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-primary/40"
                />
              </div>

              {/* Minimum Deal Score */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <label className="font-medium text-foreground">Minimum Deal Score</label>
                  <span className="text-primary">{Math.round(formData.minDealScore)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={5}
                  value={formData.minDealScore}
                  onChange={(e) =>
                    setFormData({ ...formData, minDealScore: Number(e.target.value) })
                  }
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-primary"
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>300</span>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-foreground">Categories</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-all ${
                        formData.categories.includes(cat)
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creator Exclusions */}
              <div>
                <label className="block text-sm font-medium text-foreground">Excluded Creators</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={creatorInput}
                    onChange={(e) => setCreatorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addCreatorExclusion();
                      }
                    }}
                    placeholder="Creator username..."
                    className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-foreground outline-none transition focus:border-primary/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl"
                    onClick={addCreatorExclusion}
                  >
                    Add
                  </Button>
                </div>
                {formData.excludedCreators.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.excludedCreators.map((creator) => (
                      <Badge
                        key={creator}
                        variant="secondary"
                        className="cursor-pointer rounded-full"
                        onClick={() => removeCreatorExclusion(creator)}
                      >
                        {creator}
                        <Trash2 className="ml-1.5 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1 rounded-2xl bg-primary" onClick={handleSavePreset}>
                  {selectedPreset ? "Update" : "Create"} Preset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Presets Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {presets.map((preset, index) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group overflow-hidden rounded-[28px] border border-white/10 bg-card/80 p-6 shadow-card backdrop-blur-xl transition hover:border-primary/25 hover:bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {preset.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {preset.minMargin}% margin • R${preset.maxPrice} max
                </p>
              </div>
              <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 rounded-2xl"
                  onClick={() => handleOpenDialog(preset)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <button
                    onClick={() => handleDeletePreset(preset)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialog>
              </div>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Deal Score Min</span>
                <span className="font-medium text-foreground">{preset.minDealScore}</span>
              </div>

              {preset.categories.length > 0 && preset.categories[0] !== "All" && (
                <div>
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.categories.map((cat) => (
                      <Badge key={cat} variant="outline" className="rounded-full text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {preset.excludedCreators.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Excluded Creators ({preset.excludedCreators.length})</p>
                  <p className="mt-1 text-xs text-foreground/70">
                    {preset.excludedCreators.slice(0, 2).join(", ")}
                    {preset.excludedCreators.length > 2 && ` +${preset.excludedCreators.length - 2} more`}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Button */}
            <Button
              className="mt-5 h-10 w-full rounded-2xl bg-primary/10 text-primary hover:bg-primary/20"
              onClick={() => {
                toast.success(`Switched to "${preset.name}" preset`);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Load this preset
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Info Section */}
      <section className="rounded-[28px] border border-white/10 bg-card/50 p-6 backdrop-blur-xl">
        <h3 className="font-display text-lg font-semibold">Pro Tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Create separate presets for different budget ranges and strategies</li>
          <li>• Use deal score to filter out marginal gains and focus on high-value opportunities</li>
          <li>• Exclude creators you've already hunted from to find fresh inventory</li>
          <li>• Switch presets instantly as market conditions shift throughout the day</li>
          <li>• Share preset configurations with trading partners for consistent strategies</li>
        </ul>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[28px] border-white/10 bg-card/95 backdrop-blur-xl">
          <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{presetToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
