import { useEffect, useState } from "react";
import { templatesApi, Template } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Pencil, Trash2, Copy, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<Template["category"], string> = {
  cover_letter: "Cover Letter",
  resume: "Resume",
  cold_email: "Cold Email",
  follow_up: "Follow Up",
  other: "Other",
};

const templateTypeLabels: Record<Template["templateType"], string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  general: "General",
};

const emptyTemplate = (): Partial<Template> => ({
  title: "",
  category: "cold_email",
  templateType: "general",
  content: "",
});

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Template> & { templateId?: string }>(emptyTemplate());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    templatesApi.getAll()
      .then(async (data) => {
        if (data.length === 0) {
          await templatesApi.seedDefaults();
          const seeded = await templatesApi.getAll();
          setTemplates(seeded);
        } else {
          setTemplates(data);
        }
      })
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = (cat: Template["category"]) => templates.filter((t) => t.category === cat);

  const saveTemplate = async () => {
    if (!editing.content?.trim() || !editing.title?.trim()) return;
    setSaving(true);
    try {
      if (editing.templateId) {
        const updated = await templatesApi.update(editing.templateId, editing);
        setTemplates((prev) => prev.map((t) => (t.templateId === updated.templateId ? updated : t)));
      } else {
        const created = await templatesApi.create(editing as Partial<Template>);
        setTemplates((prev) => [...prev, created]);
      }
      setDialogOpen(false);
      setEditing(emptyTemplate());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templatesApi.delete(id);
      setTemplates((prev) => prev.filter((t) => t.templateId !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  };

  const openAdd = () => { setEditing(emptyTemplate()); setDialogOpen(true); };
  const openEdit = (t: Template) => { setEditing({ ...t }); setDialogOpen(true); };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderSection = (cat: Template["category"], icon: React.ReactNode) => {
    const items = byCategory(cat);
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">{icon} {categoryLabels[cat]}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-7">No templates yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((t) => (
              <div key={t.templateId} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{t.title}</Badge>
                    <Badge variant="outline" className="text-xs bg-secondary/50">{templateTypeLabels[t.templateType]}</Badge>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(t.content)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTemplate(t.templateId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{t.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> New Template</Button>
      </div>

      {renderSection("cold_email", <MessageSquare className="h-5 w-5 text-info" />)}
      {renderSection("cover_letter", <FileText className="h-5 w-5 text-success" />)}
      {renderSection("resume", <FileText className="h-5 w-5 text-primary" />)}
      {renderSection("follow_up", <MessageSquare className="h-5 w-5 text-warning" />)}
      {renderSection("other", <FileText className="h-5 w-5 text-muted-foreground" />)}

      {/* Add/Edit Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-glass-border">
          <DialogHeader>
            <DialogTitle>{editing.templateId ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={editing.title || ""} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} className="bg-secondary/50 border-glass-border" placeholder="e.g. LinkedIn Referral Request" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editing.category || "cold_email"} onValueChange={(v) => setEditing((p) => ({ ...p, category: v as Template["category"] }))}>
                <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_email">Cold Email</SelectItem>
                  <SelectItem value="cover_letter">Cover Letter</SelectItem>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template Type</Label>
              <Select value={editing.templateType || "general"} onValueChange={(v) => setEditing((p) => ({ ...p, templateType: v as Template["templateType"] }))}>
                <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={editing.content || ""} onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))} rows={8} className="bg-secondary/50 border-glass-border" placeholder="Write your template content..." />
            </div>
            <Button onClick={saveTemplate} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editing.templateId ? "Update" : "Save"} Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
