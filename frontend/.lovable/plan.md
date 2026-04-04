

# FraudWatch — Financial Fraud Detection Dashboard

## Design System
- **Theme**: Dark "Obsidian Sentinel" — deep navy/obsidian backgrounds (#0b1326), glassmorphism panels with backdrop-blur
- **Accents**: Cyber blue (#3b82f6), emerald (#10b981), amber (#f59e0b), crimson (#ef4444)
- **Typography**: Plus Jakarta Sans (headings), Inter (body/UI)
- **Effects**: Glowing borders, glassmorphic cards, smooth micro-animations, status-colored badges

## Layout
- **Sidebar**: Collapsible nav with icons for Dashboard, Simulation Hub, Threat Alerts, Blocklist Config
- **Top Navbar**: Page title + admin profile chip
- All views use React Router for navigation

## Pages

### 1. Dashboard (Overview)
- 4 metric cards with unique icons and glowing accents (Total Volume, Active Threats, Quarantined Accounts, Suspicious Vectors)
- 2 charts side-by-side using Recharts: Line chart (Volume Telemetry) + Doughnut/Pie chart (Action Distribution with green/yellow/red)
- 2-column section: Live Transaction Feed table (left) + Critical Anomalies list (right)
- All data is mock/static

### 2. Simulation Hub
- Split layout: Left = "Inject Simulation Vector" form (entity dropdown, volume input, protocol dropdown, origin IP, geofence, execute button)
- Right = "Engine Telemetry" result card (appears on submit): animated risk meter bar, clearance status, triggered directives list, alert ID box
- Risk meter animates and changes color based on randomly generated score

### 3. Threat Alerts
- Bar chart showing threat vector frequency (Recharts)
- Threat Resolution Feed data table with action buttons
- Assessment Modal on action click: incident details, blocklist checkbox, Clear Entity / Confirm Fraud buttons

### 4. Blocklist Config
- Inline form to add block (IP/geo input, rationale, submit)
- Data table of active blocklist policies with Revoke buttons
- State managed locally with mock data

## Technical Notes
- Recharts for all charts
- React Router for page navigation
- Shadcn UI components where applicable (tables, buttons, dialogs, inputs)
- All mock data, no backend
- Responsive tables, hover states, smooth page transitions

