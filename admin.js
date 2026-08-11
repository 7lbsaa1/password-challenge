import { db, ref, onValue, update } from './firebase.js';

export class AdminManager {
  initDashboard() {
    onValue(ref(db, 'users'), (snapshot) => {
      const users = snapshot.val() || {};
      const usersList = Object.values(users);
      const totalUsersEl = document.getElementById("stat-total-users");
      const blockedUsersEl = document.getElementById("stat-blocked-users");
      
      if (totalUsersEl) totalUsersEl.innerText = usersList.length;
      if (blockedUsersEl) blockedUsersEl.innerText = usersList.filter(u => u && u.blocked).length;
    });

    onValue(ref(db, 'rooms'), (snapshot) => {
      const rooms = snapshot.val() || {};
      const activeRoomsEl = document.getElementById("stat-active-rooms");
      if (activeRoomsEl) activeRoomsEl.innerText = Object.values(rooms).filter(r => r && r.status === 'playing').length;
    });

    onValue(ref(db, 'reports'), (snapshot) => {
      const reports = snapshot.val() || {};
      const reportsEl = document.getElementById("stat-total-reports");
      if (reportsEl) reportsEl.innerText = Object.values(reports).filter(r => r && r.status === 'pending').length;
    });
  }

  initCustomersPage() {
    onValue(ref(db, 'users'), (snapshot) => {
      const users = snapshot.val() || {};
      // تحويل الكائن إلى مصفوفة وتمرير المفاتيح إذا لم يكن الـ id موجوداً داخل العنصر
      const usersList = Object.entries(users).map(([key, val]) => ({
        id: key,
        ...val
      }));
      this.renderUsersTable(usersList);
    });

    // إضافة مستمع لحقل البحث إن وجد
    const searchInput = document.getElementById("user-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        onValue(ref(db, 'users'), (snapshot) => {
          const users = snapshot.val() || {};
          const usersList = Object.entries(users).map(([key, val]) => ({
            id: key,
            ...val
          }));
          this.renderUsersTable(usersList);
        }, { onlyOnce: true });
      });
    }
  }

  renderUsersTable(usersList) {
    const tbody = document.getElementById("customers-tbody");
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchQuery = (document.getElementById("user-search-input")?.value || "").toLowerCase().trim();

    usersList
      .filter(u => {
        const userName = (u.name || u.username || "بدون اسم").toLowerCase();
        return userName.includes(searchQuery);
      })
      .forEach(user => {
        const tr = document.createElement("tr");
        const userName = user.name || user.username || "بدون اسم";
        const formattedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "غير محدد";

        tr.innerHTML = `
          <td>${userName}</td>
          <td><code>${user.id}</code></td>
          <td>${formattedDate}</td>
          <td>
            <span class="badge ${user.blocked ? 'badge-danger' : 'badge-success'}">
              ${user.blocked ? 'محظور' : 'نشط'}
            </span>
          </td>
          <td>
            <button class="btn ${user.blocked ? 'btn-gold' : 'btn-red'}" 
                    data-id="${user.id}" data-blocked="${!user.blocked}">
              ${user.blocked ? 'رفع الحظر' : 'حظر'}
            </button>
          </td>
        `;

        // ربط الزر بالدالة بشكل آمن
        const btn = tr.querySelector("button");
        btn.addEventListener("click", () => {
          this.toggleBlock(user.id, !user.blocked);
        });

        tbody.appendChild(tr);
      });
  }

  initReportsPage() {
    onValue(ref(db, 'reports'), (snapshot) => {
      const reports = snapshot.val() || {};
      const tbody = document.getElementById("reports-tbody");
      if (!tbody) return;
      tbody.innerHTML = '';

      Object.entries(reports).forEach(([reportId, report]) => {
        const tr = document.createElement("tr");
        const formattedDate = report.createdAt ? new Date(report.createdAt).toLocaleDateString("ar-EG") : "غير محدد";

        tr.innerHTML = `
          <td><strong>${report.reporterName || 'مجهول'}</strong></td>
          <td><span class="badge badge-warning">${report.reportedUserName || 'مجهول'}</span></td>
          <td>${report.reason || '-'}</td>
          <td>${formattedDate}</td>
          <td><span class="badge ${report.status === 'resolved' ? 'badge-success' : 'badge-danger'}">${report.status === 'resolved' ? 'تم الحل' : 'قيد المراجعة'}</span></td>
          <td>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline reply-btn">رد</button>
              <button class="btn btn-primary resolve-btn">حسنًا</button>
            </div>
          </td>
        `;

        tr.querySelector(".resolve-btn")?.addEventListener("click", () => {
          this.resolveReport(reportId);
        });

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
