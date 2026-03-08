import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { jobsApi, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Plus, Loader2, LayoutGrid, TableIcon, Filter, FileDown,
  Pencil, Trash2, X, AlertTriangle, CalendarIcon, Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type StatusFilter = "all" | "not_applied" | "applied_waiting" | "selected" | "rejected";
type ViewMode = "card" | "table";

const statusConfig = {
  not_applied: { label: "Not Applied", className: "bg-warning/20 text-warning border-warning/30" },
  applied_waiting: { label: "Waiting", className: "bg-info/20 text-info border-info/30" },
  selected: { label: "Selected", className: "bg-success/20 text-success border-success/30" },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

function getJobStatus(job: Job): keyof typeof statusConfig {
  if (job.applied === "no") return "not_applied";
  if (job.selected === "yes") return "selected";
  if (job.selected === "no") return "rejected";
  return "applied_waiting";
}

function StatusBadge({ job }: { job: Job }) {
  const status = getJobStatus(job);
  const config = statusConfig[status];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

const emptyJob = (): Partial<Job> => ({
  company: "", role: "", date: new Date().toISOString().split("T")[0], applied: "no", selected: "waiting",
});

export default function JobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("card");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> & { jobId?: string }>(emptyJob());
  const [saving, setSaving] = useState(false);
  const [detailCompany, setDetailCompany] = useState<string | null>(null);
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState<{ name: string; domain: string; logo: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const companyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCompany = useCallback((q: string) => {
    if (companyDebounceRef.current) clearTimeout(companyDebounceRef.current);
    if (!q.trim() || q.length < 1) { setCompanySuggestions([]); setShowSuggestions(false); return; }
    companyDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
        const json = await res.json();
        const results = json.data ?? json;
        setCompanySuggestions(Array.isArray(results) ? results : []);
        setShowSuggestions(true);
      } catch { setCompanySuggestions([]); }
    }, 250);
  }, []);

  useEffect(() => {
    jobsApi.getAll()
      .then(setJobs)
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((j) => getJobStatus(j) === filter);
  }, [jobs, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Job[]>();
    filtered.forEach((j) => {
      const existing = map.get(j.company) || [];
      existing.push(j);
      map.set(j.company, existing);
    });
    return map;
  }, [filtered]);

  const staleJobs = jobs.filter(
    (j) => j.applied === "yes" && j.selected === "waiting" && j.updatedAt && differenceInDays(new Date(), new Date(j.updatedAt)) >= 14
  );

  const saveJob = async () => {
    setSaving(true);
    try {
      if (editingJob.jobId) {
        const updated = await jobsApi.update(editingJob.jobId, editingJob);
        setJobs((prev) => prev.map((j) => (j.jobId === updated.jobId ? updated : j)));
      } else {
        const created = await jobsApi.create(editingJob as Partial<Job>);
        setJobs((prev) => [...prev, created]);
      }
      setDialogOpen(false);
      setEditingJob(emptyJob());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await jobsApi.delete(jobId);
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const byCompany = new Map<string, Job[]>();
    jobs.forEach((j) => {
      const arr = byCompany.get(j.company) || [];
      arr.push(j);
      byCompany.set(j.company, arr);
    });
    let y = 20;
    doc.setFontSize(18);
    doc.text("Job Applications", 14, y);
    y += 10;
    byCompany.forEach((companyJobs, company) => {
      doc.setFontSize(14);
      doc.text(company, 14, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [["Role", "Status", "Date Applied"]],
        body: companyJobs.map((j) => [
          j.role,
          statusConfig[getJobStatus(j)].label,
          j.date ? format(new Date(j.date), "PP") : "-",
        ]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    });
    doc.save("job-applications.pdf");
  };

  const openEdit = (job: Job) => {
    setEditingJob({ ...job });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingJob(emptyJob());
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Job</Button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button variant={view === "card" ? "default" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setView("card")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={view === "table" ? "default" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setView("table")}><TableIcon className="h-4 w-4" /></Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(["all", "not_applied", "applied_waiting", "selected", "rejected"] as StatusFilter[]).map((f) => (
                <DropdownMenuItem key={f} onClick={() => setFilter(f)} className={filter === f ? "bg-accent" : ""}>
                  {f === "all" ? "All" : statusConfig[f as keyof typeof statusConfig].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4 mr-1" /> Export PDF</Button>
        </div>
      </div>

      {staleJobs.length > 0 && !staleDismissed && (
        <div className="glass-card border-warning/30 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <p className="text-sm text-foreground flex-1">
            {staleJobs.length} application(s) have been waiting for 14+ days with no update.
          </p>
          <Button variant="ghost" size="icon" onClick={() => setStaleDismissed(true)} className="h-8 w-8 text-muted-foreground"><X className="h-4 w-4" /></Button>
        </div>
      )}

      {view === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(grouped.entries()).map(([company, companyJobs]) => (
            <div
              key={company}
              className="glass-card-hover p-5 cursor-pointer"
              onClick={() => setDetailCompany(company)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{company}</h3>
                  <p className="text-xs text-muted-foreground">{companyJobs.length} role(s)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {companyJobs.map((j) => (
                  <StatusBadge key={j.jobId} job={j} />
                ))}
              </div>
            </div>
          ))}
          {grouped.size === 0 && (
            <div className="col-span-full border-2 border-dashed border-border rounded-xl p-8 text-center">
              <p className="text-muted-foreground">No jobs found. Add your first application!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-glass-border">
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job) => (
                <TableRow key={job.jobId} className="border-glass-border">
                  <TableCell className="font-medium text-foreground">{job.company}</TableCell>
                  <TableCell className="text-foreground">{job.role}</TableCell>
                  <TableCell><StatusBadge job={job} /></TableCell>
                  <TableCell className="text-muted-foreground">{job.date ? format(new Date(job.date), "PP") : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(job)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteJob(job.jobId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No jobs found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Company Detail Modal */}
      <Dialog open={!!detailCompany} onOpenChange={(v) => !v && setDetailCompany(null)}>
        <DialogContent className="glass-card border-glass-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> {detailCompany}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {detailCompany && grouped.get(detailCompany)?.map((job) => (
              <div key={job.jobId} className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{job.role}</span>
                  <StatusBadge job={job} />
                </div>
                {job.date && <p className="text-xs text-muted-foreground">Applied: {format(new Date(job.date), "PP")}</p>}
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setDetailCompany(null); openEdit(job); }}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteJob(job.jobId)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Job Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-glass-border">
          <DialogHeader>
            <DialogTitle>{editingJob.jobId ? "Edit Job" : "Add Job"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Company</Label>
              <div className="relative">
                <Input
                  value={editingJob.company || ""}
                  onChange={(e) => {
                    setEditingJob((p) => ({ ...p, company: e.target.value }));
                    searchCompany(e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => { if (companySuggestions.length > 0) setShowSuggestions(true); }}
                  className="bg-secondary/50 border-glass-border"
                  placeholder="Start typing a company name..."
                  autoComplete="off"
                />
                {showSuggestions && companySuggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-glass-border rounded-lg shadow-lg overflow-hidden">
                    {companySuggestions.map((s) => (
                      <button
                        key={s.domain}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary/60 text-left transition-colors"
                        onMouseDown={() => {
                          setEditingJob((p) => ({ ...p, company: s.name }));
                          setShowSuggestions(false);
                        }}
                      >
                        <img src={s.logo} alt={s.name} className="h-5 w-5 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span className="text-sm text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{s.domain}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={editingJob.role || ""} onChange={(e) => setEditingJob((p) => ({ ...p, role: e.target.value }))} className="bg-secondary/50 border-glass-border" />
            </div>
            <div className="space-y-2">
              <Label>Applied?</Label>
              <Select value={editingJob.applied || "no"} onValueChange={(v) => setEditingJob((p) => ({ ...p, applied: v as "yes" | "no" }))}>
                <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingJob.applied === "yes" && (
              <div className="space-y-2">
                <Label>Selection Status</Label>
                <Select value={editingJob.selected || "waiting"} onValueChange={(v) => setEditingJob((p) => ({ ...p, selected: v as any }))}>
                  <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="yes">Selected</SelectItem>
                    <SelectItem value="no">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Date Applied</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary/50 border-glass-border", !editingJob.date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingJob.date ? format(new Date(editingJob.date), "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editingJob.date ? new Date(editingJob.date) : undefined} onSelect={(d) => { setEditingJob((p) => ({ ...p, date: d?.toISOString().split("T")[0] || "" })); setDatePickerOpen(false); }} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={saveJob} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingJob.jobId ? "Update" : "Add"} Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
