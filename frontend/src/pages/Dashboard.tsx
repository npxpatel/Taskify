import { useEffect, useState } from "react";
import { tasksApi, Task, jobsApi, Job } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Briefcase, CheckSquare, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, isToday } from "date-fns";

export default function DashboardPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([tasksApi.getAll(), jobsApi.getAll()])
      .then(([t, j]) => { setTasks(t); setJobs(j); })
      .catch((e) => toast({ title: "Error loading data", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const todayTasks = tasks.filter((t) => isToday(new Date(t.date)));
  const todayIncomplete = todayTasks.filter((t) => !t.completed).length;
  const activeApps = jobs.filter((j) => j.applied === "yes" && j.selected === "waiting").length;

  const toggleTask = async (task: Task) => {
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

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const task = await tasksApi.create({
        title: newTitle,
        date: new Date().toISOString().split("T")[0],
        completed: false,
      });
      setTasks((prev) => [...prev, task]);
      setNewTitle("");
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: "Tasks Today", value: todayIncomplete, icon: CheckSquare, color: "text-primary" },
    { label: "Active Applications", value: activeApps, icon: Briefcase, color: "text-info" },
    { label: "Total Applications", value: jobs.length, icon: BarChart3, color: "text-success" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Task</Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-glass-border">
              <DialogHeader>
                <DialogTitle>Add Quick Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title" className="bg-secondary/50 border-glass-border" onKeyDown={(e) => e.key === "Enter" && addTask()} />
                </div>
                <Button onClick={addTask} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {todayTasks.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No tasks for today. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div key={task.taskId} className="glass-card p-4 flex items-center gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </span>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.taskId)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
