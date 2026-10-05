"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Pencil,
  Sparkles,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Megaphone,
  Layers,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FeatureAnnouncement } from "@/utils/supabase/types";
import {
  getFeatureAnnouncementsAdmin,
  createFeatureAnnouncement,
  updateFeatureAnnouncement,
  deleteFeatureAnnouncement,
  toggleFeatureAnnouncementStatus,
} from "@/app/admin/feature-updates/actions";
import { AnnouncementRichEditor } from "./AnnouncementRichEditor";
import { FeatureAnnouncementsModal } from "@/components/announcements/FeatureAnnouncementsModal";

const BADGE_PRESETS = [
  "✨ New Feature",
  "🚀 Major Update",
  "📢 Announcement",
  "⚡ Improvement",
  "💡 Pro Tip",
  "🎉 Celebration",
];

export function FeatureUpdatesManager() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Form Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeatureAnnouncement | null>(null);
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("✨ New Feature");
  const [customBadge, setCustomBadge] = useState("");
  const [content, setContent] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete Confirm Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Live Preview Modal State
  const [previewItems, setPreviewItems] = useState<FeatureAnnouncement[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFeatureAnnouncementsAdmin();
      setAnnouncements(data);
    } catch (err: any) {
      toast({
        title: "Failed to load announcements",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setTitle("");
    setBadge("✨ New Feature");
    setCustomBadge("");
    setContent("<p>We are excited to introduce our new feature! Here is what you can do:</p><ul><li>Faster access to study tools</li><li>Organized chapter notes</li></ul>");
    setButtonText("Explore Now");
    setButtonUrl("/study");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (item: FeatureAnnouncement) => {
    setEditingItem(item);
    setTitle(item.title);
    if (BADGE_PRESETS.includes(item.badge || "")) {
      setBadge(item.badge || "✨ New Feature");
      setCustomBadge("");
    } else {
      setBadge("custom");
      setCustomBadge(item.badge || "");
    }
    setContent(item.content);
    setButtonText(item.button_text || "");
    setButtonUrl(item.button_url || "");
    setIsActive(item.is_active);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!content.trim() || content === "<p></p>") {
      toast({ title: "Content required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const finalBadge = badge === "custom" ? customBadge.trim() || "Update" : badge;

    try {
      if (editingItem) {
        const updated = await updateFeatureAnnouncement(editingItem.id, {
          title: title.trim(),
          content: content.trim(),
          badge: finalBadge,
          button_text: buttonText.trim() || null,
          button_url: buttonUrl.trim() || null,
          is_active: isActive,
        });
        setAnnouncements((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        toast({ title: "Announcement updated successfully!" });
      } else {
        const created = await createFeatureAnnouncement({
          title: title.trim(),
          content: content.trim(),
          badge: finalBadge,
          button_text: buttonText.trim() || null,
          button_url: buttonUrl.trim() || null,
          is_active: isActive,
        });
        setAnnouncements((prev) => [created, ...prev]);
        toast({ title: "Announcement created successfully!" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error saving announcement",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: FeatureAnnouncement) => {
    const nextStatus = !item.is_active;
    // Optimistic update
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, is_active: nextStatus } : a))
    );

    try {
      await toggleFeatureAnnouncementStatus(item.id, nextStatus);
      toast({
        title: `Popup is now ${nextStatus ? "Active" : "Inactive"}`,
      });
    } catch (err: any) {
      // Revert on error
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, is_active: item.is_active } : a))
      );
      toast({
        title: "Failed to update status",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteFeatureAnnouncement(deleteId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId));
      toast({ title: "Announcement deleted" });
      setDeleteId(null);
    } catch (err: any) {
      toast({
        title: "Failed to delete announcement",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewSingle = (item: FeatureAnnouncement) => {
    setPreviewItems([item]);
    setShowPreview(true);
  };

  const handlePreviewAllActive = () => {
    const activeOnes = announcements.filter((a) => a.is_active);
    if (activeOnes.length === 0) {
      toast({
        title: "No active announcements",
        description: "Create or activate at least one announcement to test carousel preview.",
      });
      return;
    }
    setPreviewItems(activeOnes);
    setShowPreview(true);
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === "active") return matchesSearch && item.is_active;
    if (statusFilter === "inactive") return matchesSearch && !item.is_active;
    return matchesSearch;
  });

  const totalCount = announcements.length;
  const activeCount = announcements.filter((a) => a.is_active).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Feature Popups & Announcements
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Manage &apos;What&apos;s New&apos; popup carousels shown to users after registration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handlePreviewAllActive}
            className="gap-2 border-border/80 shadow-sm"
            title="Preview all active popups as a user carousel"
          >
            <Eye className="h-4 w-4 text-accent" />
            Preview User Carousel
          </Button>

          <Button
            onClick={openCreateDialog}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Stats Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Announcements
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                Active Popups (Live)
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{activeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Inactive / Drafts
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">{inactiveCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table Card */}
      <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              Configured Popups
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Updates made here will automatically re-display to users with refreshed timestamps.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val: any) => setStatusFilter(val)}
            >
              <SelectTrigger className="h-9 w-32 text-xs rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={loadData}
              disabled={loading}
              className="h-9 w-9 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-xs text-muted-foreground font-medium">
                Loading feature announcements...
              </p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground text-base">
                No feature announcements found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "No announcements matched your search filter. Try clearing your search query."
                  : "You haven't created any feature announcements yet. Click 'New Announcement' to get started."}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog} size="sm" className="mt-2 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create Announcement
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px] font-semibold text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-xs">Title & Badge</TableHead>
                    <TableHead className="font-semibold text-xs hidden md:table-cell">
                      Button Action
                    </TableHead>
                    <TableHead className="font-semibold text-xs hidden lg:table-cell">
                      Created / Updated
                    </TableHead>
                    <TableHead className="text-right font-semibold text-xs pr-6">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/15 transition-colors">
                      {/* Active Status Switch */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => handleToggleStatus(item)}
                            title={item.is_active ? "Deactivate" : "Activate"}
                          />
                        </div>
                      </TableCell>

                      {/* Title & Badge */}
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-2 py-0 font-medium bg-accent/10 text-accent border border-accent/20 shrink-0"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <div
                            className="text-xs text-muted-foreground line-clamp-1 truncate"
                            dangerouslySetInnerHTML={{
                              __html: item.content.replace(/<[^>]+>/g, " ").slice(0, 100),
                            }}
                          />
                        </div>
                      </TableCell>

                      {/* Button Action */}
                      <TableCell className="hidden md:table-cell">
                        {item.button_text || item.button_url ? (
                          <div className="flex flex-col text-xs gap-0.5">
                            <span className="font-medium text-foreground flex items-center gap-1">
                              {item.button_text || "Default CTA"}
                              {item.button_url && (
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              )}
                            </span>
                            {item.button_url ? (
                              <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                {item.button_url}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Closes popup
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Default Close
                          </span>
                        )}
                      </TableCell>

                      {/* Created / Updated */}
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          <div>
                            <span className="text-foreground font-medium">Created: </span>
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-[11px]">
                            <span>Updated: </span>
                            {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewSingle(item)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-accent hover:bg-accent/10"
                            title="Preview Popup"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {editingItem ? "Edit Feature Announcement" : "Create New Feature Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will be shown as an interactive popup to users registered after or on the creation date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Announcement Title <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Brand New Study Planner & Tracker!"
                className="rounded-lg text-sm"
              />
            </div>

            {/* Badge Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Badge Tag</label>
                <Select
                  value={badge}
                  onValueChange={(val) => {
                    setBadge(val);
                    if (val !== "custom") setCustomBadge("");
                  }}
                >
                  <SelectTrigger className="rounded-lg text-xs">
                    <SelectValue placeholder="Select Badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_PRESETS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Tag...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {badge === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Custom Badge Text</label>
                  <Input
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="e.g., ⚡ Update v2.4"
                    className="rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            {/* Rich Content Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Content (Rich Text) <span className="text-destructive">*</span>
              </label>
              <AnnouncementRichEditor content={content} onChange={setContent} />
            </div>

            {/* CTA Button Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Button Text (Optional)
                </label>
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g., Try It Now (Default: Got It)"
                  className="rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Button URL / Route (Optional)
                </label>
                <Input
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="e.g., /study/study-planning or https://..."
                  className="rounded-lg text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Leave empty to simply dismiss popup upon click.
                </p>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground">Active Status</span>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, eligible users will see this popup on login/load.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : editingItem ? (
                  "Update Announcement"
                ) : (
                  "Create Announcement"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">
              Delete Announcement?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete this feature announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="rounded-xl text-xs"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Announcement"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Preview Modal */}
      {showPreview && previewItems && (
        <FeatureAnnouncementsModal
          isPreview={true}
          previewItems={previewItems}
          onClosePreview={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
