export const metricCards = [
  { title: "Total Volume", value: "₹48.2Cr", change: "+12.4%", icon: "Activity" as const, accent: "blue" as const },
  { title: "Active Threats", value: "23", change: "+3", icon: "ShieldAlert" as const, accent: "crimson" as const },
  { title: "Quarantined Accounts", value: "7", change: "-2", icon: "Lock" as const, accent: "amber" as const },
  { title: "Suspicious Vectors", value: "156", change: "+18", icon: "Radar" as const, accent: "emerald" as const },
];

export const volumeTelemetry = [
  { time: "00:00", volume: 2400, flagged: 200 },
  { time: "04:00", volume: 1398, flagged: 120 },
  { time: "08:00", volume: 5800, flagged: 450 },
  { time: "12:00", volume: 3908, flagged: 380 },
  { time: "16:00", volume: 4800, flagged: 290 },
  { time: "20:00", volume: 3800, flagged: 180 },
  { time: "24:00", volume: 4300, flagged: 220 },
];

export const actionDistribution = [
  { name: "Completed", value: 68, fill: "hsl(160, 84%, 39%)" },
  { name: "Flagged", value: 22, fill: "hsl(38, 92%, 50%)" },
  { name: "Blocked", value: 10, fill: "hsl(0, 84%, 60%)" },
];

export const transactions = [
  { id: "TXN-7842", entity: "Meridian Corp", volume: "₹12.4L", protocol: "Credit", timestamp: "14:32:01", status: "Completed" as const },
  { id: "TXN-7843", entity: "Apex Holdings", volume: "₹8.7L", protocol: "Transfer", timestamp: "14:32:45", status: "Flagged" as const },
  { id: "TXN-7844", entity: "Nova Systems", volume: "₹45.2L", protocol: "Debit", timestamp: "14:33:12", status: "Blocked" as const },
  { id: "TXN-7845", entity: "Zenith Ltd", volume: "₹3.1L", protocol: "Credit", timestamp: "14:33:58", status: "Completed" as const },
  { id: "TXN-7846", entity: "Pulse Finance", volume: "₹22.8L", protocol: "Transfer", timestamp: "14:34:20", status: "Flagged" as const },
];

export const anomalies = [
  { account: "ACC-9921", alertId: "ALT-4401", risk: 94 },
  { account: "ACC-8834", alertId: "ALT-4402", risk: 87 },
  { account: "ACC-7712", alertId: "ALT-4403", risk: 76 },
  { account: "ACC-6605", alertId: "ALT-4404", risk: 62 },
  { account: "ACC-5598", alertId: "ALT-4405", risk: 55 },
];

export const entities = ["Meridian Corp", "Apex Holdings", "Nova Systems", "Zenith Ltd", "Pulse Finance", "Orbit Global"];

export const threatVectorFrequency = [
  { rule: "Velocity Check", count: 42 },
  { rule: "Geo Mismatch", count: 31 },
  { rule: "Amount Threshold", count: 28 },
  { rule: "IP Blacklist", count: 19 },
  { rule: "Device Fingerprint", count: 15 },
  { rule: "Time Anomaly", count: 12 },
];

export const incidents = [
  { id: "INC-0012", entity: "Apex Holdings", volume: "₹8.7L", risk: 91, directives: "Velocity, Geo Mismatch", origin: "103.24.78.12", state: "Open" as const },
  { id: "INC-0013", entity: "Nova Systems", volume: "₹45.2L", risk: 87, directives: "Amount Threshold", origin: "89.12.45.67", state: "Open" as const },
  { id: "INC-0014", entity: "Pulse Finance", volume: "₹22.8L", risk: 76, directives: "IP Blacklist, Velocity", origin: "192.168.1.45", state: "Resolved" as const },
  { id: "INC-0015", entity: "Orbit Global", volume: "₹15.3L", risk: 68, directives: "Device Fingerprint", origin: "45.67.89.12", state: "Open" as const },
];

export const blocklist = [
  { id: "POL-001", vector: "103.24.78.12", rationale: "Repeated velocity violations from Eastern EU cluster", date: "2024-03-15" },
  { id: "POL-002", vector: "Mumbai, IN (Andheri)", rationale: "Geo mismatch pattern with high-value transfers", date: "2024-03-14" },
  { id: "POL-003", vector: "89.12.45.67", rationale: "Botnet C2 infrastructure node", date: "2024-03-12" },
];

export const simulationDirectives = [
  "Velocity check failed — 12 transactions in 60s window",
  "Geo-fence violation — Origin mismatch with registered entity locale",
  "Amount exceeds entity's daily threshold by 340%",
  "IP flagged in threat intelligence feed (Tier-2)",
];
