import { db, ref, onValue, update } from './firebase.js';

export class AdminManager {
  initDashboard() {
    onValue(ref(db, 'users'), (snapshot) => {
      const users = snapshot.val() || {};
      const usersList = Object.values(users);
      const totalUsersEl = document.getElementById("stat-total-users");
      const blockedUsersEl = document.getElementById("stat-blocked-users");
      
      if (totalUsersEl) totalUsersEl.innerText = usersList.length;
      if (blockedUsersEl) blockedUsersEl.innerText = usersList.filter(u => u.blocked).length;
    });

    onValue(ref(db, 'rooms'), (snapshot) => {
      const rooms = snapshot.val() || {};
      const activeRoomsEl = document.getElementById("stat-active-rooms");
      if (activeRoomsEl) activeRoomsEl.innerText = Object.values(rooms).filter(r => r.status === 'playing').length;
    });

    onValue(ref(db, 'reports'), (snapshot) => {
      const reports = snapshot.val() || {};
      const reportsEl = document.getElementById("stat-total-reports");
      if (reportsEl) reportsEl.innerText = Object.values(reports).filter(r => r.status === 'pending').length;
    });
  }

  initCustomersPage() {
    onValue(ref(db, 'users'), (snapshot) => {
      const users = snapshot.val() || {};
      this.renderUsersTable(Object.values(users));
    });
  }

  renderUsersTable(usersList) {
    const tbody = document.getElementById("customers-tbody");
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchQuery = (document.getElementById("user-search-input")?.value || "").toLowerCase();

    usersList
      .filter(u => u.name.toLowerCase().includes(searchQuery))
      .forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${user.name}</td>
          <td><code>${user.id}</code></td>
          <td>${new Date(user.createdAt).toLocaleDateString("ar-EG")}</td>
          <td>
            <span class="badge ${user.blocked ? 'badge-danger' : 'badge-success'}">
              ${user.blocked ? 'محظور' : 'نشط'}
            </span>
          </td>
          <td>
            <button class="btn ${user.blocked ? 'btn-gold' : 'btn-red'}" 
                    onclick="toggleUserBlock('${user.id}', ${!user.blocked})">
              ${user.blocked ? 'رفع الحظر' : 'حظر'}
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
  }

  initReportsPage() {
    onValue(ref(db, 'reports'), (snapshot) => {
      const reports = snapshot.val() || {};
      const tbody = document.getElementById("reports-tbody");
      if (!tbody) return;
      tbody.innerHTML = '';

      Object.values(reports).forEach(report => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${report.reporterName}</strong></td>
          <td><span class="badge badge-warning">${report.reportedUserName}</span></td>
          <td>${report.reason}</td>
          <td>${new Date(report.createdAt).toLocaleDateString("ar-EG")}</td>
          <td><span class="badge ${report.status === 'resolved' ? 'badge-success' : 'badge-danger'}">${report.status === 'resolved' ? 'تم الحل' : 'قيد المراجعة'}</span></td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline" onclick="adminReplyToReport('${report.reportId}')">رد</button>
              <button class="btn btn-primary" onclick="resolveReport('${report.reportId}')">حسنًا</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  async toggleBlock(userId, blockStatus) {
    await update(ref(db, `users/${userId}`), { blocked: blockStatus });
  }

  async resolveReport(reportId) {
    await update(ref(db, `reports/${reportId}`), { status: 'resolved' });
  }
}

export const adminMgr = new AdminManager();
