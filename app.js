// Firebase Config Setup
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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ১. লাইভ ইউজার
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

// ২. অটো লগইন ও ইনিশিয়ালাইজেশন
window.onload = function() {
  const savedName = localStorage.getItem('reliance_user_name') || 'EMON';
  const savedId = localStorage.getItem('reliance_user_id') || '12373';
  const savedBasic = localStorage.getItem('reliance_basic_salary') || '13000';

  document.getElementById('user-name').value = savedName;
  document.getElementById('user-id').value = savedId;
  if(document.getElementById('setting-basic')) document.getElementById('setting-basic').value = savedBasic;

  // তারিখ ও রিপোর্ট মান্থ সেট
  const today = new Date();
  document.getElementById('form-date').valueAsDate = today;
  
  const monthStr = today.toISOString().slice(0, 7);
  document.getElementById('report-month').value = monthStr;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date-str').innerText = today.toLocaleDateString('bn-BD', options);

  loadUserOTData();
};

function saveUserInfo() {
  const name = document.getElementById('user-name').value;
  const id = document.getElementById('user-id').value;

  if (name && id) {
    localStorage.setItem('reliance_user_name', name);
    localStorage.setItem('reliance_user_id', id);
    alert('পরিচয় সংরক্ষিত হয়েছে!');
    loadUserOTData();
  }
}

function saveSettings() {
  const basic = document.getElementById('setting-basic').value || '13000';
  localStorage.setItem('reliance_basic_salary', basic);
  alert('সেটিংস সংরক্ষণ করা হয়েছে!');
  loadUserOTData();
}

// ৩. পপ-আপ ফর্ম কন্ট্রোল
function openAddModal() {
  document.getElementById('addModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}

// ৪. নতুন দৈনিক হিসাব সেভ করা
function saveDailyRecord() {
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

  const otPay = ot * rate;
  const userId = localStorage.getItem('reliance_user_id') || '12373';

  db.ref('ot_records/' + userId + '/' + date).set({
    date: date,
    duty: duty,
    ot: ot,
    rate: rate,
    otPay: otPay,
    otherPay: other,
    note: note,
    timestamp: Date.now()
  }).then(() => {
    alert('হিসাব সফলভাবে সংরক্ষণ করা হয়েছে!');
    closeAddModal();
    loadUserOTData();
  });
}

// ৫. ডাটা লোড ও মাসিক রিপোর্ট ফিল্টারিং (স্ক্রিনশটের ফর্ম্যাটে)
function loadUserOTData() {
  const userId = localStorage.getItem('reliance_user_id') || '12373';
  const selectedMonth = document.getElementById('report-month').value; // YYYY-MM
  const basicSalary = parseFloat(localStorage.getItem('reliance_basic_salary')) || 13000;

  db.ref('ot_records/' + userId).on('value', (snap) => {
    let totalDutyHours = 0;
    let totalOtHours = 0;
    let totalOtPay = 0;
    let totalOtherPay = 0;

    let historyHTML = '<table border="1" style="width:100%; text-align:center; border-collapse:collapse; font-size:13px; margin-top:8px;">';
    historyHTML += '<tr style="background:#16a34a; color:white;"><th>তারিখ</th><th>Duty</th><th>OT</th><th>রেট</th><th>টাকা</th></tr>';

    const todayKey = new Date().toISOString().split('T')[0];

    if (snap.exists()) {
      snap.forEach((child) => {
        const item = child.val();

        // হোম স্ক্রিন আপডেট
        if (child.key === todayKey) {
          document.getElementById('today-duty').innerText = item.duty || 0;
          document.getElementById('today-ot').innerText = item.ot || 0;
          document.getElementById('today-ot-pay').innerText = item.otPay || 0;
        }

        // নির্বাচন করা মাসের হিসাব ফিল্টার
        if (item.date && item.date.startsWith(selectedMonth)) {
          totalDutyHours += (item.duty || 0);
          totalOtHours += (item.ot || 0);
          totalOtPay += (item.otPay || 0);
          totalOtherPay += (item.otherPay || 0);

          historyHTML += `<tr>
            <td style="padding:6px;">${item.date}</td>
            <td>${item.duty} ঘণ্টা</td>
            <td>${item.ot} ঘণ্টা</td>
            <td>৳${item.rate}</td>
            <td>৳${item.otPay}</td>
          </tr>`;
        }
      });
      historyHTML += '</table>';
    } else {
      historyHTML = '<p style="text-align:center; color:#777; padding:10px;">কোনো রেকর্ড পাওয়া যায়নি।</p>';
    }

    // হোম স্ক্রিনে এই মাসের মোট
    document.getElementById('month-total').innerText = totalOtPay;
    document.getElementById('ot-history-list').innerHTML = historyHTML;
    if(document.getElementById('calendar-history-list')) {
      document.getElementById('calendar-history-list').innerHTML = historyHTML;
    }

    // 📊 মাসিক রিপোর্ট স্ক্রিন আপডেট (স্ক্রিনশটের সাথে মিলিয়ে)
    const totalIncome = basicSalary + totalOtPay + totalOtherPay;

    document.getElementById('rep-duty-hours').innerText = totalDutyHours;
    document.getElementById('rep-ot-hours').innerText = totalOtHours;
    document.getElementById('rep-basic-salary').innerText = basicSalary;
    document.getElementById('rep-ot-pay').innerText = totalOtPay;
    document.getElementById('rep-other-pay').innerText = totalOtherPay;
    document.getElementById('rep-total-income').innerText = totalIncome;
  });
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
