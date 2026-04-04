import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, CheckCircle, XCircle } from "lucide-react";

const ThreatAlerts = () => {
  const [modalIncident, setModalIncident] = useState<any>(null);
  const [addToBlocklist, setAddToBlocklist] = useState(false);
  const [incidentList, setIncidentList] = useState<any[]>([]);
  const [threatFreq, setThreatFreq] = useState<any[]>([]);

  const loadAlerts = () => {
    fetchApi('/alerts').then((res: any) => {
      setIncidentList(res.map((r: any) => ({
        id: r.alert_id,
        entity: r.account_name,
        volume: `₹${r.amount}`,
        risk: r.risk_score,
        directives: r.rules_fired,
        origin: r.ip_address || r.city_country,
        state: r.alert_status === 'OPEN' ? 'Open' : 'Resolved'
      })));

      const ruleCounts: any = {};
      res.forEach((alert: any) => {
         if (alert.rules_fired && alert.rules_fired !== 'None' && alert.rules_fired.trim() !== '') {
             alert.rules_fired.split(',').map((r:string)=>r.trim()).forEach((r:string) => {
                 ruleCounts[r] = (ruleCounts[r] || 0) + 1;
             });
         }
      });
      setThreatFreq(Object.entries(ruleCounts).map(([rule, count]) => ({ rule, count })));
    }).catch(console.error);
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleAction = async (action: "clear" | "confirm") => {
    if (modalIncident) {
      try {
        const resolution = action === "clear" ? "false_positive" : "confirm_fraud";
        await fetchApi(`/alerts/${modalIncident.id}/resolve`, {
          method: 'POST',
          body: JSON.stringify({ resolution, blacklist_location: addToBlocklist })
        });
        loadAlerts();
      } catch (err) {
        console.error("Failed to resolve alert", err);
      }
    }
    setModalIncident(null);
    setAddToBlocklist(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Threat Vector Frequency</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={threatFreq}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
            <XAxis dataKey="rule" stroke="hsl(215 20% 55%)" fontSize={11} />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={11} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(222 40% 10%)", border: "1px solid hsl(217 33% 17%)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Threat Resolution Feed</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Incident ID</TableHead>
                <TableHead className="text-muted-foreground text-xs">Target Entity</TableHead>
                <TableHead className="text-muted-foreground text-xs">Exposed Vol</TableHead>
                <TableHead className="text-muted-foreground text-xs">Risk</TableHead>
                <TableHead className="text-muted-foreground text-xs">Violated Directives</TableHead>
                <TableHead className="text-muted-foreground text-xs">Origin</TableHead>
                <TableHead className="text-muted-foreground text-xs">State</TableHead>
                <TableHead className="text-muted-foreground text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidentList.map((inc) => (
                <TableRow key={inc.id} className="border-border/30 hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-mono text-xs text-primary">{inc.id}</TableCell>
                  <TableCell className="text-sm">{inc.entity}</TableCell>
                  <TableCell className="text-sm font-medium">{inc.volume}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${inc.risk >= 80 ? "bg-destructive/15 text-destructive" : "bg-fw-amber/15 text-fw-amber"}`}>
                      {inc.risk}%
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{inc.directives}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{inc.origin}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${inc.state === "Open" ? "bg-fw-amber/15 text-fw-amber" : "bg-fw-emerald/15 text-fw-emerald"}`}>
                      {inc.state}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => setModalIncident(inc)}
                      disabled={inc.state === "Resolved"}
                    >
                      <Shield className="w-3 h-3 mr-1" /> Assess
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!modalIncident} onOpenChange={() => setModalIncident(null)}>
        <DialogContent className="glass-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Assessment — {modalIncident?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-secondary/40 border border-border/30 space-y-1">
              <p className="text-xs text-muted-foreground">Entity: <span className="text-foreground">{modalIncident?.entity}</span></p>
              <p className="text-xs text-muted-foreground">Risk Score: <span className="text-destructive font-bold">{modalIncident?.risk}%</span></p>
              <p className="text-xs text-muted-foreground">Origin: <span className="font-mono text-foreground">{modalIncident?.origin}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="blocklist" checked={addToBlocklist} onCheckedChange={(c) => setAddToBlocklist(!!c)} />
              <label htmlFor="blocklist" className="text-sm text-muted-foreground cursor-pointer">Add origin vector to Global Blocklist</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => handleAction("clear")} className="bg-fw-emerald hover:bg-fw-emerald/90 text-primary-foreground font-semibold">
                <CheckCircle className="w-4 h-4 mr-1" /> Clear Entity
              </Button>
              <Button onClick={() => handleAction("confirm")} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold">
                <XCircle className="w-4 h-4 mr-1" /> Confirm Fraud
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThreatAlerts;
