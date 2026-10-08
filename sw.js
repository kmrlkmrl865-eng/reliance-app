// App Data State
let appData = {
  settings: {
    basicSalary: 0,
    otRate: 0,
    otherAllowance: 0
  },
  records: {} // Format: { "YYYY-MM-DD": { duty: 8, ot: 2, otRate: 50, other: 0, note: "" } }
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  setCurrentDateHeader();
  updateHomeSummary();
  initFormDates();
});

// Load Data from LocalStorage
function loadData() {
  const saved = localStorage.getItem("reliance_app_data");
  if (saved) {
    try {
      appData = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse data", e);
    }
  }
}

// Save Data to LocalStorage
function saveData() {
  localStorage.setItem("reliance_app_data", JSON.stringify(appData));
}

// UI Functions
function setCurrentDateHeader() {
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const dateStr = today.toLocaleDateString('bn-BD', options);
  const dateElem = document.getElementById("current-date-text");
  if (dateElem) dateElem.innerText = `আজকের তারিখ: ${dateStr}`;
}

function switchTab(tabName, btnElement) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

  const selectedTab = document.getElementById(`tab-${tabName}`);
  if (selectedTab) selectedTab.classList.add('active');
  if (btnElement) btnElement.classList.add('active');

  if (tabName === 'home') updateHomeSummary();
  if (tabName === 'report') initReportTab();
  if (tabName === 'settings') loadSettingsForm();
}

function initFormDates() {
  const todayStr = new Date().toISOString().split('T')[0];
  const entryDate = document.getElementById("entry-date");
  if (entryDate) entryDate.value = todayStr;

  const calDate = document.getElementById("calendar-date-select");
  if (calDate) calDate.value = todayStr;

  const repMonth = document.getElementById("report-month-select");
  if (repMonth) repMonth.value = todayStr.substring(0, 7);
}

// Home Summary
function updateHomeSummary() {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);
  const todayRecord = appData.records[todayStr] || { duty: 0, ot: 0, otRate: appData.settings.otRate || 0, other: 0 };

  document.getElementById("sum-today-duty").innerText = `${todayRecord.duty || 0} ঘণ্টা`;
  document.getElementById("sum-today-ot").innerText = `${todayRecord.ot || 0} ঘণ্টা`;
  
  const otPayToday = (todayRecord.ot || 0) * (todayRecord.otRate || appData.settings.otRate || 0);
  document.getElementById("sum-today-otpay").innerText = `৳${otPayToday.toFixed(0)}`;

  // Calculate Month Total
  let monthTotal = 0;
  Object.keys(appData.records).forEach(date => {
    if (date.startsWith(currentMonthStr)) {
      const rec = appData.records[date];
      const otAmt = (rec.ot || 0) * (rec.otRate || 0);
      const otherAmt = Number(rec.other || 0);
      monthTotal += otAmt + otherAmt;
    }
  });

  document.getElementById("sum-month-total").innerText = `৳${monthTotal.toFixed(0)}`;
}

// Modal Control
function openEntryModal() {
  const entryOtRate = document.getElementById("entry-ot-rate");
  if (entryOtRate) entryOtRate.value = appData.settings.otRate || 0;
  
  const todayStr = new Date().toISOString().split('T')[0];
  if (appData.records[todayStr]) {
    const rec = appData.records[todayStr];
    document.getElementById("entry-duty").value = rec.duty;
    document.getElementById("entry-ot").value = rec.ot;
    document.getElementById("entry-ot-rate").value = rec.otRate;
    document.getElementById("entry-other").value = rec.other;
    document.getElementById("entry-note").value = rec.note || "";
  }

  document.getElementById("entry-modal").style.display = "flex";
}

function closeEntryModal() {
  document.getElementById("entry-modal").style.display = "none";
}

// Save Daily Record
function saveDailyRecord(e) {
  e.preventDefault();
  const date = document.getElementById("entry-date").value;
  const duty = parseFloat(document.getElementById("entry-duty").value) || 0;
  const ot = parseFloat(document.getElementById("entry-ot").value) || 0;
  const otRate = parseFloat(document.getElementById("entry-ot-rate").value) || (appData.settings.otRate || 0);
  const other = parseFloat(document.getElementById("entry-other").value) || 0;
  const note = document.getElementById("entry-note").value;

  appData.records[date] = { duty, ot, otRate, other, note };
  saveData();
  closeEntryModal();
  updateHomeSummary();
  alert("আজকের হিসাব সংরক্ষণ করা হয়েছে!");
}

// Settings
function loadSettingsForm() {
  document.getElementById("set-basic").value = appData.settings.basicSalary || "";
  document.getElementById("set-ot-rate").value = appData.settings.otRate || "";
  document.getElementById("set-other").value = appData.settings.otherAllowance || 0;
}

function saveSettings(e) {
  e.preventDefault();
  appData.settings.basicSalary = parseFloat(document.getElementById("set-basic").value) || 0;
  appData.settings.otRate = parseFloat(document.getElementById("set-ot-rate").value) || 0;
  appData.settings.otherAllowance = parseFloat(document.getElementById("set-other").value) || 0;
  
  saveData();
  alert("সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
}

// Calendar Detail
function loadCalendarDetail() {
  const date = document.getElementById("calendar-date-select").value;
  const detailBox = document.getElementById("calendar-detail");
  const rec = appData.records[date];

  if (rec) {
    const otPay = rec.ot * rec.otRate;
    detailBox.innerHTML = `
      <p><strong>Duty:</strong> ${rec.duty} ঘণ্টা</p>
      <p><strong>OT:</strong> ${rec.ot} ঘণ্টা (৳${otPay})</p>
      <p><strong>Other Pay:</strong> ৳${rec.other}</p>
      <p><strong>Note:</strong> ${rec.note || "নেই"}</p>
    `;
  } else {
    detailBox.innerHTML = `<p>এই তারিখে কোনো হিসাব এন্ট্রি করা হয়নি।</p>`;
  }
}

// Report Render
function initReportTab() {
  renderReport();
}

function renderReport() {
  const monthStr = document.getElementById("report-month-select").value;
  let totalDuty = 0;
  let totalOt = 0;
  let totalOtPay = 0;
  let totalOther = 0;

  Object.keys(appData.records).forEach(date => {
    if (date.startsWith(monthStr)) {
      const rec = appData.records[date];
      totalDuty += Number(rec.duty || 0);
      totalOt += Number(rec.ot || 0);
      totalOtPay += Number((rec.ot || 0) * (rec.otRate || 0));
      totalOther += Number(rec.other || 0);
    }
  });

  const basic = Number(appData.settings.basicSalary || 0);
  const grandTotal = basic + totalOtPay + totalOther;

  document.getElementById("rep-duty").innerText = totalDuty;
  document.getElementById("rep-ot").innerText = totalOt;
  document.getElementById("rep-basic").innerText = basic;
  document.getElementById("rep-otpay").innerText = totalOtPay.toFixed(0);
  document.getElementById("rep-other").innerText = totalOther.toFixed(0);
  document.getElementById("rep-total").innerText = grandTotal.toFixed(0);
}
