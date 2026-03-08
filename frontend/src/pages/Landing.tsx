import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Zap, ArrowRight, Briefcase, CheckSquare, FileText,
  BarChart3, Shield, Clock, Sparkles, ChevronRight, Star,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: Briefcase,
    label: "Application Tracker",
    desc: "Card & table views, filters, company grouping, and PDF export for every application.",
  },
  {
    icon: CheckSquare,
    label: "Smart Tasks",
    desc: "Date-grouped tasks with priorities, overdue alerts, and one-click completion.",
  },
  {
    icon: FileText,
    label: "Template Vault",
    desc: "Save cold outreach messages and cover letter snippets. Copy to clipboard instantly.",
  },
  {
    icon: BarChart3,
    label: "Dashboard Insights",
    desc: "See today's tasks, active applications, and total stats at a glance.",
  },
  {
    icon: Shield,
    label: "Secure & Private",
    desc: "Cookie-based auth, encrypted sessions. Your data stays yours.",
  },
  {
    icon: Clock,
    label: "Stale Alerts",
    desc: "Auto-detect applications stuck waiting 14+ days. Never lose track.",
  },
];

const stats = [
  { value: "10x", label: "More organized" },
  { value: "50+", label: "Templates ready" },
  { value: "100%", label: "Free to start" },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Taskify</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button className="glow-sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="glow-sm">Get Started Free</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-32 px-4">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb w-[500px] h-[500px] bg-primary/15 top-[-10%] left-[10%] animate-pulse-glow" />
          <div className="orb w-[400px] h-[400px] bg-primary/10 bottom-[10%] right-[5%] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="orb w-[300px] h-[300px] bg-accent/10 top-[30%] right-[30%] animate-pulse-glow" style={{ animationDelay: "3s" }} />
        </div>

        {/* Grid pattern behind hero */}
        <div className="absolute inset-0 grid-pattern radial-fade pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Badge */}
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Built for ambitious job seekers</span>
            <ChevronRight className="h-3 w-3 text-primary/60" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-foreground leading-[0.95] tracking-tight mb-8"
          >
            Track your
            <br />
            <span className="text-gradient-warm">job hunt</span>
            <br />
            like a pro
          </motion.h1>

          {/* Subheading */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed"
          >
            Manage applications, tasks, and outreach templates — all in one beautiful dashboard.
            Land your next role, faster.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="glow-md text-base px-8 h-12 text-lg font-semibold">
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="h-12 text-base border-glass-border hover:bg-secondary/50">
                I have an account
              </Button>
            </Link>
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            {...fadeUp(0.45)}
            className="flex items-center justify-center gap-8 md:gap-12 mt-16"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gradient">{s.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="relative z-10 max-w-5xl mx-auto mt-20"
        >
          <div className="glass-card p-1.5 glow-lg">
            <div className="bg-card rounded-lg overflow-hidden border border-glass-border">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-glass-border bg-secondary/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-secondary/60 rounded-md px-4 py-1 text-xs text-muted-foreground font-mono">
                    app.taskify.io/dashboard
                  </div>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Tasks Today", val: "5", color: "text-primary" },
                    { label: "Active Apps", val: "12", color: "text-info" },
                    { label: "Total Apps", val: "34", color: "text-success" },
                  ].map((s) => (
                    <div key={s.label} className="bg-secondary/40 rounded-lg p-4 border border-glass-border">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {["Follow up with Google recruiter", "Submit Amazon application", "Prepare portfolio for Meta"].map((t, i) => (
                    <div key={t} className="flex items-center gap-3 bg-secondary/30 rounded-lg px-4 py-3 border border-glass-border">
                      <div className={`w-4 h-4 rounded border-2 ${i === 0 ? "bg-primary border-primary" : "border-muted-foreground/40"}`} />
                      <span className={`text-sm ${i === 0 ? "line-through text-muted-foreground" : "text-foreground"}`}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Everything you need to <span className="text-gradient">land the job</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-card-hover p-6 group"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{f.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb w-[600px] h-[600px] bg-primary/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-2xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-warning text-warning" />
            ))}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Ready to take control?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of job seekers who track smarter, not harder.
          </p>
          <Link to="/register">
            <Button size="lg" className="glow-md text-base px-10 h-12 text-lg font-semibold">
              Get Started — It's Free <Zap className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Taskify</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Taskify. Built with ambition.
          </p>
        </div>
      </footer>
    </div>
  );
}
