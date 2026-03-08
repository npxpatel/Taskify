import { useState } from "react";
import { Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Partial<Task> & { taskId?: string };
  onTaskChange: (task: Partial<Task> & { taskId?: string }) => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
}

export function TaskDialog({ open, onOpenChange, task, onTaskChange, onSave, saving }: TaskDialogProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const set = (patch: Partial<Task>) => onTaskChange({ ...task, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-glass-border">
        <DialogHeader>
          <DialogTitle>{task.taskId ? "Edit Task" : "Add Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={task.title || ""}
              onChange={(e) => set({ title: e.target.value })}
              className="bg-secondary/50 border-glass-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary/50 border-glass-border",
                    !task.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {task.date ? format(new Date(task.date), "PP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.date ? new Date(task.date) : undefined}
                  onSelect={(d) => {
                    set({ date: d?.toISOString() || "" });
                    setDatePickerOpen(false);
                  }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={task.priority || "none"}
              onValueChange={(v) => set({ priority: v === "none" ? undefined : (v as any) })}
            >
              <SelectTrigger className="bg-secondary/50 border-glass-border">
                <SelectValue />
              </SelectTrigger>
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
            <Textarea
              value={task.description || ""}
              onChange={(e) => set({ description: e.target.value })}
              className="bg-secondary/50 border-glass-border"
            />
          </div>
          <Button onClick={onSave} className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {task.taskId ? "Update" : "Add"} Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
