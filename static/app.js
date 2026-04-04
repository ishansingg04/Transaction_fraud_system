document.addEventListener("DOMContentLoaded", () => {
    let telemetryChartInstance = null;
    let statusChartInstance = null;
    let rulesChartInstance = null;
    
    // --- Navigation & View Switching ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active to clicked link
            link.classList.add('active');
            
            // Switch view
            const targetView = link.getAttribute('data-view');
            views.forEach(view => {
                view.classList.remove('active-view');
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active-view');
                }
            });
            
            // Update title
            pageTitle.innerText = link.querySelector('.links_name').innerText;
            
            // Load data based on view
            loadDataForView(targetView);
        });
    });

    // --- Data Loading Functions ---
    function loadDataForView(view) {
        if (view === 'dashboard') loadDashboard();
        else if (view === 'simulate') loadAccountsForSimulation();
        else if (view === 'alerts') loadAlerts();
        else if (view === 'blacklist') loadBlacklist();
    }

    // Status classes helper
    const getStatusClass = (status) => {
        switch(status?.toUpperCase()) {
            case 'COMPLETED': case 'CLOSED': return 'status-completed';
            case 'FLAGGED': return 'status-flagged';
            case 'BLOCKED': return 'status-blocked';
            case 'PENDING': case 'OPEN': return 'status-pending';
            default: return 'status-pending';
        }
    };

    // 1. Dashboard
    async function loadDashboard() {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            
            const animateValue = (id, end) => {
                const obj = document.getElementById(id);
                if (obj.innerText == end) return;
                const start = parseInt(obj.innerText) || 0;
                const duration = 1000;
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    obj.innerHTML = Math.floor(progress * (end - start) + start);
                    if (progress < 1) window.requestAnimationFrame(step);
                    else obj.innerHTML = end;
                };
                window.requestAnimationFrame(step);
            };

            animateValue('dash-total-txns', data.total_txns);
            animateValue('dash-open-alerts', data.open_alerts);
            animateValue('dash-blocked-accs', data.blocked_accounts);
            animateValue('dash-flagged-txns', data.flagged_txns);
            
            // Recent Txns
            const txnBody = document.querySelector('#recent-txns-table tbody');
            const previousFirstId = txnBody.firstElementChild ? txnBody.firstElementChild.getAttribute('data-id') : null;
            txnBody.innerHTML = '';
            
            data.recent_txns.forEach((txn, index) => {
                const isNew = previousFirstId && index === 0 && String(txn.transaction_id) !== previousFirstId;
                txnBody.innerHTML += `
                    <tr data-id="${txn.transaction_id}" class="${isNew ? 'row-flash' : ''}">
                        <td>${txn.transaction_id}</td>
                        <td style="font-weight: 500;">${txn.account_name}</td>
                        <td style="color: #fff;">₹${txn.amount}</td>
                        <td>${txn.transaction_type}</td>
                        <td style="color: var(--on-surface-variant);">${txn.date_time}</td>
                        <td><span class="status-badge ${getStatusClass(txn.status_code)}"><i class='bx bx-radio-circle-marked'></i> ${txn.status_code}</span></td>
                    </tr>
                `;
            });
            
            // Active Alerts
            const alertsList = document.getElementById('active-alerts-list');
            alertsList.innerHTML = '';
            data.active_alerts.forEach(alert => {
                alertsList.innerHTML += `
                    <li>
                        <div>
                            <span class="alert-acc">${alert.account_name}</span>
                            <span class="alert-id">${alert.alert_id} | ${alert.rules_fired}</span>
                        </div>
                        <div class="status-badge ${getStatusClass(alert.alert_status)}" style="font-size: 14px;">
                            ${alert.risk_score} RISK
                        </div>
                    </li>
                `;
            });

            // Re-render Graphs
            renderTelemetryChart(data.recent_txns);
            renderStatusChart(data.completed_txns, data.flagged_txns, data.blocked_txns);
            
        } catch (err) {
            console.error("Failed to load dashboard:", err);
        }
    }

    // Chart.js renderer
    function renderTelemetryChart(recent_txns) {
        const ctx = document.getElementById('telemetryChart').getContext('2d');
        
        // Reverse array to show oldest to newest left to right
        const chartData = [...recent_txns].reverse();
        
        const labels = chartData.map(t => {
            const time = new Date(t.date_time);
            return time.getHours() + ':' + (time.getMinutes()<10?'0':'') + time.getMinutes();
        });
        
        const amounts = chartData.map(t => t.amount);
        
        // We can color the points based on status
        const pointColors = chartData.map(t => {
            if (t.status_code === 'BLOCKED') return '#EF4444'; // Danger
            if (t.status_code === 'FLAGGED') return '#F59E0B'; // Warning
            return '#3B82F6'; // Default primary
        });

        if (telemetryChartInstance) {
            telemetryChartInstance.destroy();
        }
        
        telemetryChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Transaction Volume (₹)',
                    data: amounts,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: pointColors,
                    pointBorderColor: '#0b1326',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(23, 31, 51, 0.9)',
                        titleColor: '#c2c6d6',
                        bodyColor: '#dae2fd',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(140, 144, 159, 0.1)', borderColor: 'transparent' },
                        ticks: { color: '#9aa0b6' }
                    },
                    y: {
                        grid: { color: 'rgba(140, 144, 159, 0.1)', borderColor: 'transparent' },
                        ticks: { color: '#9aa0b6' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Add Status Chart renderer
    function renderStatusChart(completed, flagged, blocked) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        
        if (statusChartInstance) {
            statusChartInstance.destroy();
        }
        
        statusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Flagged', 'Blocked'],
                datasets: [{
                    data: [completed, flagged, blocked],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    borderColor: '#0b1326',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#c2c6d6', font: { family: 'Inter', size: 12 }, padding: 15 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(23, 31, 51, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#dae2fd',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10
                    }
                }
            }
        });
    }

    // 2. Simulate View
    async function loadAccountsForSimulation() {
        try {
            const res = await fetch('/api/accounts');
            const accounts = await res.json();
            const select = document.getElementById('sim-account');
            select.innerHTML = '<option value="" disabled selected>Select an Account Matrix</option>';
            accounts.forEach(acc => {
                select.innerHTML += `<option value="${acc.account_number}">${acc.account_name} (Liquidity: ₹${acc.account_balance})</option>`;
            });
        } catch (err) {
            console.error("Failed to load accounts:", err);
        }
    }

    document.getElementById('simulate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            account_number: document.getElementById('sim-account').value,
            amount: document.getElementById('sim-amount').value,
            transaction_type: document.getElementById('sim-type').value,
            ip_address: document.getElementById('sim-ip').value || '192.168.1.1',
            city_country: document.getElementById('sim-location').value || 'Unknown',
            date_time: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        // Show result box instantly with a loading visual if we wanted, but API is fast enough
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if (result.error) {
                alert("Error: " + result.error);
                return;
            }
            
            // Show result
            document.getElementById('sim-result-container').style.display = 'block';
            
            const statusBadge = document.getElementById('res-status');
            statusBadge.innerText = result.final_status;
            statusBadge.className = `status-badge ${getStatusClass(result.final_status)}`;
            
            document.getElementById('res-score').innerText = result.total_score;
            
            // Risk Meter fill logic
            const fill = document.getElementById('res-risk-fill');
            const scorePercentage = Math.min(result.total_score, 100);
            fill.style.width = scorePercentage + '%';
            if (result.total_score === 0) fill.style.backgroundColor = '#10B981';
            else if (result.total_score < 70) fill.style.backgroundColor = '#F59E0B';
            else fill.style.backgroundColor = '#EF4444';
            
            const rulesUl = document.getElementById('res-rules');
            if (result.rules_fired && result.rules_fired.length > 0) {
                rulesUl.innerHTML = result.rules_fired.map(r => `<li>${r}</li>`).join('');
                document.getElementById('res-alert-id').style.display = 'block';
                document.getElementById('res-alert-id').innerText = `SYSTEM ALERT ID: ${result.alert_id}`;
            } else {
                rulesUl.innerHTML = '<li style="color: var(--success);">All checks nominal. Zero directives violated.</li>';
                document.getElementById('res-alert-id').style.display = 'none';
            }
            
            // Refresh account balances
            loadAccountsForSimulation();
            loadDashboard(); // Update dashboard charts and lists dynamically
            
            // Clear inputs
            document.getElementById('sim-amount').value = '';
            
        } catch (err) {
            console.error("Failed to simulate:", err);
        }
    });

    // 3. Alerts View
    async function loadAlerts() {
        try {
            const res = await fetch('/api/alerts');
            const alerts = await res.json();
            const tbody = document.querySelector('#alerts-table tbody');
            tbody.innerHTML = '';
            
            alerts.forEach(alert => {
                let actionBtn = alert.alert_status === 'OPEN' 
                    ? `<button class="btn btn-small" onclick="openResolveModal('${alert.alert_id}')"><i class='bx bx-check'></i> Action</button>` 
                    : '<span style="color:var(--on-surface-variant); font-size:12px;">RESOLVED</span>';
                    
                tbody.innerHTML += `
                    <tr>
                        <td style="font-family: monospace;">${alert.alert_id}</td>
                        <td style="font-weight: 500;">${alert.account_name}</td>
                        <td style="color: #fff;">₹${alert.amount}</td>
                        <td style="color: ${alert.risk_score > 69 ? 'var(--danger)' : 'var(--warning)'}; font-weight:700;">${alert.risk_score}</td>
                        <td style="font-size: 13px;">${alert.rules_fired}</td>
                        <td style="font-size: 13px; color: var(--on-surface-variant);">${alert.city_country} <br> ${alert.ip_address}</td>
                        <td><span class="status-badge ${getStatusClass(alert.alert_status)}">${alert.alert_status}</span></td>
                        <td>${actionBtn}</td>
                    </tr>
                `;
            });
            
            // Re-render Alert Rules Chart
            renderRulesChart(alerts);
            
        } catch (err) {
            console.error("Failed to load alerts:", err);
        }
    }

    // Alert Rules Chart renderer
    function renderRulesChart(alerts) {
        if (!document.getElementById('rulesChart')) return;
        const ctx = document.getElementById('rulesChart').getContext('2d');
        
        const ruleCounts = {};
        alerts.forEach(alert => {
            if (alert.rules_fired && alert.rules_fired !== 'None' && alert.rules_fired.trim() !== '') {
                const rules = alert.rules_fired.split(',').map(r => r.trim());
                rules.forEach(rule => {
                    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
                });
            }
        });
        
        const labels = Object.keys(ruleCounts);
        const data = Object.values(ruleCounts);
        
        if (rulesChartInstance) {
            rulesChartInstance.destroy();
        }
        
        rulesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Violations Count',
                    data: data,
                    backgroundColor: 'rgba(245, 158, 11, 0.4)',
                    borderColor: '#F59E0B',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: 'rgba(23, 31, 51, 0.9)' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#9aa0b6' },
                        grid: { color: 'rgba(140, 144, 159, 0.1)', borderColor: 'transparent' }
                    },
                    x: {
                        ticks: { color: '#9aa0b6' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Modal Logic with CSS animation
    const modal = document.getElementById("resolveModal");
    const closeBtn = document.querySelector(".close");
    let currentAlertId = null;

    window.openResolveModal = function(alertId) {
        currentAlertId = alertId;
        document.getElementById("modal-alert-id").innerText = alertId;
        document.getElementById("modal-blacklist-ip").checked = false;
        
        modal.style.display = "flex";
        // tiny delay to allow display flex to apply before opacity transition starts
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    closeBtn.onclick = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = "none";
        }, 300); // match transition duration
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            closeBtn.onclick();
        }
    }

    window.resolveAlertConfirm = async function(resolutionType) {
        try {
            const blacklistIp = document.getElementById("modal-blacklist-ip").checked;
            const res = await fetch(`/api/alerts/${currentAlertId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    resolution: resolutionType,
                    blacklist_location: blacklistIp
                })
            });
            const result = await res.json();
            
            if (result.success) {
                closeBtn.onclick();
                loadAlerts(); // Refresh alerts list
            } else {
                alert("Error resolving alert");
            }
        } catch (err) {
            console.error("Failed to resolve alert:", err);
        }
    }

    // 4. Blacklist View
    async function loadBlacklist() {
        try {
            const res = await fetch('/api/blacklist');
            const data = await res.json();
            const tbody = document.querySelector('#blacklist-table tbody');
            tbody.innerHTML = '';
            
            data.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td style="font-family: monospace;">${item.blacklist_id}</td>
                        <td style="color: #fff; font-weight: 500;">${item.blocked_value}</td>
                        <td style="color: var(--on-surface-variant);">${item.reason_code}</td>
                        <td style="font-family: monospace;">${item.date_added}</td>
                        <td><button class="btn btn-danger btn-small" style="background:transparent; border: 1px solid var(--danger); box-shadow:none; color:var(--danger);" onclick="deleteBlacklist('${item.blacklist_id}')">Revoke</button></td>
                    </tr>
                `;
            });
        } catch (err) {
            console.error("Failed to load blacklist:", err);
        }
    }

    document.getElementById('blacklist-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            blocked_value: document.getElementById('bl-value').value,
            reason_code: document.getElementById('bl-reason').value
        };
        
        try {
            const res = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if (result.success) {
                document.getElementById('bl-value').value = '';
                document.getElementById('bl-reason').value = '';
                loadBlacklist();
            } else {
                alert(result.error || "Failed to engange block policy");
            }
        } catch (err) {
            console.error("Failed to add blacklist:", err);
        }
    });

    window.deleteBlacklist = async function(id) {
        if (!confirm('Revoke this blocking policy?')) return;
        
        try {
            const res = await fetch(`/api/blacklist/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                loadBlacklist();
            }
        } catch (err) {
            console.error("Failed to delete blacklist policy:", err);
        }
    }

    // Initial Load
    loadDashboard();
});
