import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Zap, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface SimResult {
  riskScore: number;
  status: "COMPLETED" | "FLAGGED" | "BLOCKED";
  directives: string[];
  alertId: string | null;
}

const SimulationHub = () => {
  const [result, setResult] = useState<SimResult | null>(null);
  const [animatedRisk, setAnimatedRisk] = useState(0);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("1250000");
  const [protocol, setProtocol] = useState("Credit");
  const [ip, setIp] = useState("103.24.78.12");
  const [geofence, setGeofence] = useState("Mumbai, IN");

  useEffect(() => {
    fetchApi('/accounts').then((res: any) => {
      setAccounts(res);
      if (res.length > 0) setSelectedAccount(res[0].account_number);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        account_number: selectedAccount,
        amount: parseFloat(amount),
        transaction_type: protocol.toUpperCase(),
        ip_address: ip,
        city_country: geofence,
        date_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      const res: any = await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(payload) });
      if (res.error) { alert(res.error); return; }

      const score = res.total_score || 0;
      setResult({ 
        riskScore: score, 
        status: res.final_status, 
        directives: res.rules_fired || [], 
        alertId: res.alert_id || null 
      });

      setAnimatedRisk(0);
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= score) {
          setAnimatedRisk(score);
          clearInterval(interval);
        } else {
          setAnimatedRisk(current);
        }
      }, 20);
    } catch (err) {
      console.error(err);
    }
  };

  const riskColor = animatedRisk >= 75 ? "bg-destructive" : animatedRisk >= 40 ? "bg-fw-amber" : "bg-fw-emerald";
  const statusIcon = result?.status === "COMPLETED" ? <CheckCircle className="w-5 h-5 text-fw-emerald" /> : result?.status === "FLAGGED" ? <AlertTriangle className="w-5 h-5 text-fw-amber" /> : <XCircle className="w-5 h-5 text-destructive" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Form */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Inject Simulation Vector
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs mb-1.5 block">Target Entity</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => <SelectItem key={a.account_number} value={a.account_number}>{a.account_name} (₹{a.account_balance})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1.5 block">Volume (₹)</Label>
            <Input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary/50 border-border/50" />
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1.5 block">Protocol</Label>
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Debit">Debit</SelectItem>
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Origin IP</Label>
              <Input placeholder="0.0.0.0" value={ip} onChange={e => setIp(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Geofence</Label>
              <Input placeholder="City, Country" value={geofence} onChange={e => setGeofence(e.target.value)} className="bg-secondary/50 border-border/50" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Zap className="w-4 h-4 mr-1" /> Execute Transfer
          </Button>
        </form>
      </div>

      {/* Results */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-foreground mb-5">Engine Telemetry</h3>
        {!result ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Execute a simulation to view telemetry...
          </div>
        ) : (
          <div className="space-y-5 animate-scale-in">
            {/* Risk Meter */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-muted-foreground">Risk Assessment</span>
                <span className="text-sm font-mono font-bold text-foreground">{animatedRisk}%</span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${riskColor}`} style={{ width: `${animatedRisk}%` }} />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/30">
              {statusIcon}
              <div>
                <p className="text-xs text-muted-foreground">Clearance Status</p>
                <p className="font-heading font-bold text-foreground">{result.status}</p>
              </div>
            </div>

            {/* Directives */}
            {result.directives.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Triggered Directives</p>
                <div className="space-y-2">
                  {result.directives.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert ID */}
            {result.alertId && (
              <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 shadow-[0_0_20px_-5px_hsl(0_84%_60%/0.3)] text-center">
                <p className="text-xs text-muted-foreground mb-1">System Alert ID</p>
                <p className="font-mono font-bold text-destructive text-lg animate-glow-pulse">{result.alertId}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationHub;
