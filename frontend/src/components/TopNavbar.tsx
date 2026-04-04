import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Command Center",
  "/simulation": "Simulation Hub",
  "/threats": "Threat Alerts",
  "/blocklist": "Blocklist Config",
};

export function TopNavbar() {
  const location = useLocation();
  const title = titles[location.pathname] || "FraudWatch";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 glass-card rounded-none">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <h1 className="font-heading font-semibold text-lg text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-secondary/80 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-glow-pulse" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">SO</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground hidden sm:inline">Sec-Ops Admin</span>
        </div>
      </div>
    </header>
  );
}
