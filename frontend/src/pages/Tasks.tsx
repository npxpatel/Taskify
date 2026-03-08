import { useEffect, useState, useMemo } from "react";
import { tasksApi, Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Plus, Loader2, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isPast, isFuture, startOfDay } from "date-fns";

type TabFilter = "all" | "active" | "completed";

const priorityConfig = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
};

function categorize(tasks: Task[]) {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const upcoming: Task[] = [];

  tasks.forEach((t) => {
    const d = startOfDay(new Date(t.date));
    if (isToday(d)) today.push(t);
    else if (isTomorrow(d)) tomorrow.push(t);
    else if (isPast(d) && !t.completed) overdue.push(t);
    else upcoming.push(t);
  });

  return { overdue, today, tomorrow, upcoming };
}

const emptyTask = (): Partial<Task> => ({ title: "", date: new Date().toISOString(), priority: undefined, description: "", completed: false });

export default function TasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> & { taskId?: string }>(emptyTask());
  const [saving, setSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    tasksApi.getAll()
      .then(setTasks)
      .catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "active") return tasks.filter((t) => !t.completed);
    if (tab === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, tab]);

  const sections = useMemo(() => categorize(filtered), [filtered]);

  const toggle = async (task: Task) => {
    try {
      const updated = await tasksApi.update(task.taskId, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.taskId === task.taskId ? updated : t)));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.taskId !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const saveTask = async () => {
    if (!editingTask.title?.trim() || !editingTask.date) return;
    setSaving(true);
    try {
      if (editingTask.taskId) {
        const updated = await tasksApi.update(editingTask.taskId, editingTask);
        setTasks((prev) => prev.map((t) => (t.taskId === updated.taskId ? updated : t)));
      } else {
        const created = await tasksApi.create(editingTask as Omit<Task, "taskId">);
        setTasks((prev) => [...prev, created]);
      }
      setDialogOpen(false);
      setEditingTask(emptyTask());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (task: Task) => { setEditingTask({ ...task }); setDialogOpen(true); };
  const openAdd = () => { setEditingTask(emptyTask()); setDialogOpen(true); };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderSection = (title: string, items: Task[], accent?: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className={cn("text-sm font-semibold uppercase tracking-wider", accent || "text-muted-foreground")}>{title}</h3>
        {items.map((task) => (
          <div key={task.taskId} className="glass-card p-4 flex items-center gap-3">
            <Checkbox checked={task.completed} onCheckedChange={() => toggle(task)} className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
            <div className="flex-1 min-w-0">
              <span className={cn("text-sm block", task.completed ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</span>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-secondary/50">{format(new Date(task.date), "MMM d")}</Badge>
                {task.priority && <Badge variant="outline" className={cn("text-xs", priorityConfig[task.priority])}>{task.priority}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTask(task.taskId)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <div className="flex items-center gap-2">
          <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-6">
        {renderSection("Overdue", sections.overdue, "text-destructive")}
        {renderSection("Today", sections.today, "text-primary")}
        {renderSection("Tomorrow", sections.tomorrow)}
        {renderSection("Upcoming", sections.upcoming)}
        {filtered.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No tasks found. Create one to get started!</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-glass-border">
          <DialogHeader>
            <DialogTitle>{editingTask.taskId ? "Edit Task" : "Add Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={editingTask.title || ""} onChange={(e) => setEditingTask((p) => ({ ...p, title: e.target.value }))} className="bg-secondary/50 border-glass-border" />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary/50 border-glass-border", !editingTask.date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editingTask.date ? format(new Date(editingTask.date), "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editingTask.date ? new Date(editingTask.date) : undefined} onSelect={(d) => { setEditingTask((p) => ({ ...p, date: d?.toISOString() || "" })); setDatePickerOpen(false); }} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={editingTask.priority || "none"} onValueChange={(v) => setEditingTask((p) => ({ ...p, priority: v === "none" ? undefined : v as any }))}>
                <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingTask.description || ""} onChange={(e) => setEditingTask((p) => ({ ...p, description: e.target.value }))} className="bg-secondary/50 border-glass-border" />
            </div>
            <Button onClick={saveTask} className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingTask.taskId ? "Update" : "Add"} Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
