import { db, ref, push, set } from './firebase.js';
import { auth } from './auth.js';

export async function submitReport(reportedUserId, reportedUserName, reasonText) {
  if (!reasonText.trim()) {
    alert("الرجاء كتابة سبب البلاغ!");
    return;
  }

  const reportsRef = ref(db, 'reports');
  const newReportRef = push(reportsRef);

  const reportData = {
    reportId: newReportRef.key,
    reporterId: auth.userId,
    reporterName: auth.userName,
    reportedUserId: reportedUserId,
    reportedUserName: reportedUserName,
    reason: reasonText.trim(),
    createdAt: Date.now(),
    status: 'pending' // pending, resolved
  };

  await set(newReportRef, reportData);
  alert("شكرًا، سيتم مراجعة البلاغ.");
}
