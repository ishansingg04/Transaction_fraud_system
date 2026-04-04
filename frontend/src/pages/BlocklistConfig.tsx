import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ban, Plus, Trash2 } from "lucide-react";

const BlocklistConfig = () => {
  const [list, setList] = useState<any[]>([]);
  const [vector, setVector] = useState("");
  const [rationale, setRationale] = useState("");

  const loadBlocklist = () => {
    fetchApi('/blacklist').then((res: any) => {
      setList(res.map((r: any) => ({
        id: r.blacklist_id,
        vector: r.blocked_value,
        rationale: r.reason_code,
        date: r.date_added
      })));
    }).catch(console.error);
  };

  useEffect(() => { loadBlocklist(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vector.trim()) return;
    try {
      const res: any = await fetchApi('/blacklist', {
        method: 'POST',
        body: JSON.stringify({ blocked_value: vector.trim(), reason_code: rationale.trim() })
      });
      if (res.error) {
        alert(res.error);
      } else {
        setVector("");
        setRationale("");
        loadBlocklist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetchApi(`/blacklist/${id}`, { method: 'DELETE' });
      loadBlocklist();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Form */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
          <Ban className="w-4 h-4 text-destructive" /> Enforce Block
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="IP Address or Geolocation"
            value={vector}
            onChange={(e) => setVector(e.target.value)}
            className="bg-secondary/50 border-border/50 flex-1"
          />
          <Input
            placeholder="Threat Rationale"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="bg-secondary/50 border-border/50 flex-[2]"
          />
          <Button type="submit" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold whitespace-nowrap">
            <Plus className="w-4 h-4 mr-1" /> Add to Blocklist
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Global Blocklist</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Policy ID</TableHead>
                <TableHead className="text-muted-foreground text-xs">Blocked Vector</TableHead>
                <TableHead className="text-muted-foreground text-xs">Rationale</TableHead>
                <TableHead className="text-muted-foreground text-xs">Enforcement Date</TableHead>
                <TableHead className="text-muted-foreground text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id} className="border-border/30 hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-mono text-xs text-primary">{item.id}</TableCell>
                  <TableCell className="font-mono text-sm">{item.vector}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px]">{item.rationale}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRevoke(item.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No active blocklist policies</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BlocklistConfig;
