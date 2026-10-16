// ⚡ সার্ভিস ওয়ার্কার
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered!', reg))
      .catch(err => console.log('Service Worker Failed!', err));
  });
}

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCzMYQQ5GldS8CBCz...",
  authDomain: "reliance-app-1d8f6.firebaseapp.com",
  databaseURL: "https://reliance-app-1d8f6-default-rtdb.firebaseio.com",
  projectId: "reliance-app-1d8f6",
  storageBucket: "reliance-app-1d8f6.appspot.com",
  messagingSenderId: "800312325129",
  appId: "1:800312325129:web:ec01...",
  measurementId: "G-VCMJ9L50M1"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

let db = null;
if (typeof firebase !== 'undefined') {
  db = firebase.database();
}

// ১. অনলাইন ইউজার ও ভিজিটর
if (db) {
  const onlineRef = db.ref('presence/' + Date.now());
  const connectedRef = db.ref('.info/connected');

  connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
      onlineRef.onDisconnect().remove();
      onlineRef.set(true);
    }
  });

  db.ref('presence').on('value', (snap) => {
    const onlineEl = document.getElementById('live-online');
    if (onlineEl) onlineEl.innerText = snap.numChildren();
  });

  const visitorRef = db.ref('stats/totalVisitors');
  visitorRef.transaction((current) => (current || 0) + 1);
  visitorRef.on('value', (snap) => {
    const totalEl = document.getElementById('total-visitors');
    if (totalEl) totalEl.innerText = snap.val() || 0;
  });
}

// 🟢 তারিখ থেকে বাংলায় বারের নাম বের করার ফাংশন
function getBengaliDayName(dateString) {
  if (!dateString) return '';
  const dateObj = new Date(dateString);
  const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  return days[dateObj.getDay()] || '';
}

// ২. অটো লোড
window.onload = function() {
  const savedName = localStorage.getItem('reliance_user_name') || '';
  const savedId = localStorage.getItem('reliance_user_id') || '';
  
  document.getElementById('user-name').value = savedName;
  document.getElementById('user-id').value = savedId;

  if (savedId) {
    loadUserSettings(savedId);
    loadUserOTData();
  }

  const today = new Date();
  document.getElementById('form-date').valueAsDate = today;
  
  const monthStr = today.toISOString().slice(0, 7);
  document.getElementById('report-month').value = monthStr;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date-str').innerText = today.toLocaleDateString('bn-BD', options);
};

// কাস্টম সেটিংস লোড
function loadUserSettings(userId) {
  const savedBasic = localStorage.getItem('reliance_basic_' + userId) || '13000';
  const savedOtRate = localStorage.getItem('reliance_ot_rate_' + userId) || '53';
  const savedBonus = localStorage.getItem('reliance_bonus_' + userId) || '300';
  const savedAbsent = localStorage.getItem('reliance_absent_' + userId) || '0';

  if(document.getElementById('setting-basic')) document.getElementById('setting-basic').value = savedBasic;
  if(document.getElementById('setting-ot-rate')) document.getElementById('setting-ot-rate').value = savedOtRate;
  if(document.getElementById('setting-present-bonus')) document.getElementById('setting-present-bonus').value = savedBonus;
  if(document.getElementById('setting-absent-days')) document.getElementById('setting-absent-days').value = savedAbsent;
}

// পরিচয় সেভ
function saveUserInfo() {
  const name = document.getElementById('user-name').value.trim();
  const id = document.getElementById('user-id').value.trim();

  if (name && id) {
    localStorage.setItem('reliance_user_name', name);
    localStorage.setItem('reliance_user_id', id);
    alert('আপনার পরিচয় সফলভাবে সংরক্ষিত হয়েছে!');
    loadUserSettings(id);
    loadUserOTData();
  } else {
    alert('দয়া করে আপনার নাম ও আলাদা একটি আইডি নম্বর দিন।');
  }
}

// সেটিংস সেভ
function saveSettings() {
  const userId = localStorage.getItem('reliance_user_id');
  if (!userId) {
    alert('প্রথমে হোম পেজে নাম ও আইডি সেভ করুন!');
    return;
  }

  const basic = document.getElementById('setting-basic').value || '0';
  const otRate = document.getElementById('setting-ot-rate').value || '0';
  const bonus = document.getElementById('setting-present-bonus').value || '0';
  const absent = document.getElementById('setting-absent-days').value || '0';

  localStorage.setItem('reliance_basic_' + userId, basic);
  localStorage.setItem('reliance_ot_rate_' + userId, otRate);
  localStorage.setItem('reliance_bonus_' + userId, bonus);
  localStorage.setItem('reliance_absent_' + userId, absent);

  alert('আপনার সমস্ত কাস্টম সেটিংস সেভ হয়েছে!');
  loadUserOTData();
}

// ৩. পপ-আপ মডাল
function openAddModal() {
  const userId = localStorage.getItem('reliance_user_id');
  if (!userId) {
    alert('হিসাব যোগ করার আগে উপরে নাম ও আইডি দিয়ে সংরক্ষণ করুন!');
    return;
  }

  const savedOtRate = localStorage.getItem('reliance_ot_rate_' + userId) || '53';
  document.getElementById('form-rate').value = savedOtRate;
  document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

// ৪. দৈনিক হিসাব সংরক্ষণ
function saveDailyRecord() {
  const userId = localStorage.getItem('reliance_user_id');
  if (!userId) {
    alert('প্রথমে আপনার পরিচয় সংরক্ষণ করুন।');
    return;
  }

  const date = document.getElementById('form-date').value;
  const duty = parseFloat(document.getElementById('form-duty').value) || 0;
  const ot = parseFloat(document.getElementById('form-ot').value) || 0;
  const rate = parseFloat(document.getElementById('form-rate').value) || 0;
  const other = parseFloat(document.getElementById('form-other').value) || 0;
  const note = document.getElementById('form-note').value || '';

  if (!date) {
    alert('দয়া করে তারিখ নির্বাচন করুন।');
    return;
  }

  localStorage.setItem('reliance_ot_rate_' + userId, rate);
  if(document.getElementById('setting-ot-rate')) {
    document.getElementById('setting-ot-rate').value = rate;
  }

  const otPay = ot * rate;

  const recordData = {
    date: date,
    duty: duty,
    ot: ot,
    rate: rate,
    otPay: otPay,
    otherPay: other,
    note: note,
    timestamp: Date.now()
  };

  let localRecords = JSON.parse(localStorage.getItem('local_ot_records_' + userId) || '{}');
  localRecords[date] = recordData;
  localStorage.setItem('local_ot_records_' + userId, JSON.stringify(localRecords));

  if (navigator.onLine && db) {
    db.ref('ot_records/' + userId + '/' + date).set(recordData);
  }

  alert('হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!');
  closeAddModal();
  loadUserOTData();
}

// ৫. ডাটা লোড ও আগের টেবিল মডেলে বারসহ প্রদর্শন
function loadUserOTData() {
  const userId = localStorage.getItem('reliance_user_id');
  if (!userId) return;

  const selectedMonth = document.getElementById('report-month').value;
  const basicSalary = parseFloat(localStorage.getItem('reliance_basic_' + userId)) || 0;
  const presentBonus = parseFloat(localStorage.getItem('reliance_bonus_' + userId)) || 0;
  const absentDays = parseFloat(localStorage.getItem('reliance_absent_' + userId)) || 0;

  let localRecords = JSON.parse(localStorage.getItem('local_ot_records_' + userId) || '{}');

  const renderData = (records) => {
    let totalDutyHours = 0;
    let totalOtHours = 0;
    let totalOtPay = 0;
    let totalOtherPay = 0;

    let historyHTML = '<table border="1" style="width:100%; text-align:center; border-collapse:collapse; font-size:13px; margin-top:8px;">';
    historyHTML += '<tr style="background:#16a34a; color:white;"><th>তারিখ</th><th>Duty</th><th>OT</th><th>রেট</th><th>টাকা</th></tr>';

    const todayKey = new Date().toISOString().split('T')[0];

    const sortedDates = Object.keys(records).sort();

    sortedDates.forEach((key) => {
      const item = records[key];

      if (item.date === todayKey) {
        document.getElementById('today-duty').innerText = item.duty || 0;
        document.getElementById('today-ot').innerText = item.ot || 0;
        document.getElementById('today-ot-pay').innerText = item.otPay || 0;
      }

      if (item.date && item.date.startsWith(selectedMonth)) {
        totalDutyHours += (item.duty || 0);
        totalOtHours += (item.ot || 0);
        totalOtPay += (item.otPay || 0);
        totalOtherPay += (item.otherPay || 0);

        const dayName = getBengaliDayName(item.date);
        const formattedDate = `${item.date}<br><small style="color:#16a34a; font-weight:bold;">(${dayName})</small>`;

        historyHTML += `<tr>
          <td style="padding:6px; font-weight:500;">${formattedDate}</td>
          <td>${item.duty} ঘণ্টা</td>
          <td>${item.ot} ঘণ্টা</td>
          <td>৳${item.rate}</td>
          <td>৳${item.otPay}</td>
        </tr>`;
      }
    });

    historyHTML += '</table>';

    document.getElementById('month-total').innerText = totalOtPay;
    document.getElementById('ot-history-list').innerHTML = historyHTML;
    if(document.getElementById('calendar-history-list')) {
      document.getElementById('calendar-history-list').innerHTML = historyHTML;
    }

    // 🔴 Absent মাইনাস হিসাব
    const absentHours = absentDays * 8;
    const finalDutyHours = Math.max(0, totalDutyHours - absentHours);

    const perDaySalary = basicSalary / 30;
    const absentDeduction = absentDays * perDaySalary;
    const adjustedBasic = Math.max(0, basicSalary - absentDeduction);

    const absentInfoEl = document.getElementById('absent-deduct-info');
    if (absentDays > 0) {
      absentInfoEl.style.display = 'block';
      absentInfoEl.innerText = `🔻 অনুপস্থিতি (${absentDays} দিন): -${absentHours} ঘণ্টা ডিউটি / -৳${Math.round(absentDeduction)} কর্তন`;
    } else {
      absentInfoEl.style.display = 'none';
    }

    const totalIncome = Math.round(adjustedBasic + presentBonus + totalOtPay + totalOtherPay);

    document.getElementById('rep-duty-hours').innerText = finalDutyHours;
    document.getElementById('rep-ot-hours').innerText = totalOtHours;
    document.getElementById('rep-basic-salary').innerText = Math.round(adjustedBasic);
    document.getElementById('rep-present-bonus').innerText = presentBonus;
    document.getElementById('rep-ot-pay').innerText = totalOtPay;
    document.getElementById('rep-other-pay').innerText = totalOtherPay;
    document.getElementById('rep-total-income').innerText = totalIncome;
  };

  renderData(localRecords);

  if (navigator.onLine && db) {
    db.ref('ot_records/' + userId).on('value', (snap) => {
      if (snap.exists()) {
        const firebaseData = snap.val();
        localStorage.setItem('local_ot_records_' + userId, JSON.stringify(firebaseData));
        renderData(firebaseData);
      }
    });
  }
}

// ৬. ট্যাব নেভিগেশন
function switchTab(tabName, element) {
  document.querySelectorAll('.tab-page').forEach(page => page.style.display = 'none');
  document.getElementById('tab-' + tabName).style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  element.classList.add('active');
}

// ৭. কল ও হোয়াটসঅ্যাপ
function makeCall() {
  window.location.href = "tel:01734883213";
}

function openWhatsApp() {
  window.location.href = "https://wa.me/8801734883213";
}
