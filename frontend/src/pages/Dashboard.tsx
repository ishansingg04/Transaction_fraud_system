import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Lock, Radar } from "lucide-react";
import {
  metricCards as initialMetrics, volumeTelemetry as initialTelemetry, actionDistribution as initialActions,
  transactions as initialTxns, anomalies as initialAnomalies,
} from "@/data/mockData";
import { fetchApi } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const iconMap = { Activity, ShieldAlert, Lock, Radar };
const accentMap = {
  blue: "border-primary/30 shadow-[0_0_15px_-3px_hsl(217_91%_60%/0.25)]",
  crimson: "border-destructive/30 shadow-[0_0_15px_-3px_hsl(0_84%_60%/0.25)]",
  amber: "border-fw-amber/30 shadow-[0_0_15px_-3px_hsl(38_92%_50%/0.25)]",
  emerald: "border-fw-emerald/30 shadow-[0_0_15px_-3px_hsl(160_84%_39%/0.25)]",
};
const iconColorMap = {
  blue: "text-primary bg-primary/10",
  crimson: "text-destructive bg-destructive/10",
  amber: "text-fw-amber bg-fw-amber/10",
  emerald: "text-fw-emerald bg-fw-emerald/10",
};

const StatusBadge = ({ status }: { status: string }) => {
  const cls = status === "Completed" ? "status-completed" : status === "Flagged" ? "status-flagged" : "status-blocked";
  return <span className={cls}>{status}</span>;
};

const RiskBadge = ({ score }: { score: number }) => {
  const color = score >= 80 ? "text-destructive bg-destructive/15" : score >= 60 ? "text-fw-amber bg-fw-amber/15" : "text-fw-emerald bg-fw-emerald/15";
  return <span className={`status-badge ${color}`}>{score}%</span>;
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [actions, setActions] = useState(initialActions);
  const [txns, setTxns] = useState(initialTxns);
  const [alerts, setAlerts] = useState(initialAnomalies);

  useEffect(() => {
    fetchApi('/dashboard').then((res: any) => {
      setMetrics([
        { title: "Total Volume", value: res.total_txns.toString(), change: "", icon: "Activity", accent: "blue" },
        { title: "Active Threats", value: res.open_alerts.toString(), change: "", icon: "ShieldAlert", accent: "crimson" },
        { title: "Quarantined Accounts", value: res.blocked_accounts.toString(), change: "", icon: "Lock", accent: "amber" },
        { title: "Suspicious Vectors", value: res.flagged_txns.toString(), change: "", icon: "Radar", accent: "emerald" },
      ]);
      setTxns(res.recent_txns.map((t: any) => ({
        id: t.transaction_id,
        entity: t.account_name,
        volume: `₹${t.amount}`,
        protocol: t.transaction_type,
        timestamp: t.date_time.split(' ')[1] || t.date_time,
        status: t.status_code.charAt(0).toUpperCase() + t.status_code.slice(1).toLowerCase()
      })));
      setAlerts(res.active_alerts.map((a: any) => ({
        account: a.account_name,
        alertId: a.alert_id,
        risk: a.risk_score
      })));
      setActions([
        { name: "Completed", value: res.completed_txns, fill: "hsl(160, 84%, 39%)" },
        { name: "Flagged", value: res.flagged_txns, fill: "hsl(38, 92%, 50%)" },
        { name: "Blocked", value: res.blocked_txns, fill: "hsl(0, 84%, 60%)" },
      ]);
      const reversed = [...res.recent_txns].reverse();
      setTelemetry(reversed.map((t: any) => ({
        time: (t.date_time.split(' ')[1] || t.date_time).substring(0, 5),
        volume: t.amount,
        flagged: t.status_code !== 'COMPLETED' ? t.amount : 0
      })));
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((card) => {
          const Icon = iconMap[card.icon];
          return (
            <div key={card.title} className={`glass-card p-5 border ${accentMap[card.accent]} transition-all duration-300 hover:scale-[1.02]`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorMap[card.accent]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium ${card.change.startsWith('+') ? 'text-fw-emerald' : 'text-destructive'}`}>
                  {card.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <p className="text-2xl font-heading font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Volume Telemetry Overlay</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={telemetry}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="time" stroke="hsl(215 20% 55%)" fontSize={11} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222 40% 10%)", border: "1px solid hsl(217 33% 17%)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="volume" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="flagged" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Global Action Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={actions} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4} stroke="none">
                {actions.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222 40% 10%)", border: "1px solid hsl(217 33% 17%)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Live Transaction Feed</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Route ID</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Entity</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Volume</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Protocol</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.map((tx) => (
                  <TableRow key={tx.id} className="border-border/30 hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-mono text-xs text-primary">{tx.id}</TableCell>
                    <TableCell className="text-sm">{tx.entity}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.volume}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.protocol}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.timestamp}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Critical Anomalies</h3>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.alertId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/30 hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.account}</p>
                  <p className="text-xs font-mono text-muted-foreground">{a.alertId}</p>
                </div>
                <RiskBadge score={a.risk} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
