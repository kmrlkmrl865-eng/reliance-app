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

// ১. লাইভ ইউজার গণনাকারি
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

// ২. অটো লগইন এবং তথ্য লোড
window.onload = function() {
  const savedName = localStorage.getItem('reliance_user_name') || 'EMON';
  const savedId = localStorage.getItem('reliance_user_id') || '12373';

  updateUserDisplay(savedName, savedId);
  loadUserOTData(savedId);

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date-str').innerText = new Date().toLocaleDateString('bn-BD', options);
};

function updateUserDisplay(name, id) {
  document.getElementById('disp-badge-name').innerText = name;
  document.getElementById('disp-badge-id').innerText = id;
  document.getElementById('user-name').value = name;
  document.getElementById('user-id').value = id;
}

function saveUserInfo() {
  const name = document.getElementById('user-name').value;
  const id = document.getElementById('user-id').value;

  if (name && id) {
    localStorage.setItem('reliance_user_name', name);
    localStorage.setItem('reliance_user_id', id);

    db.ref('users/' + id).set({
      name: name,
      updatedAt: new Date().toISOString()
    });

    updateUserDisplay(name, id);
    alert('পরিচয় সংরক্ষিত হয়েছে!');
    loadUserOTData(id);
  } else {
    alert('দয়া করে নাম ও আইডি দিন।');
  }
}

// ৩. তারিখ পরিবর্তনযোগ্য OT হিসাব যোগ করা
function showAddRecordModal() {
  const defaultDate = new Date().toISOString().split('T')[0];
  const inputDate = prompt("তারিখ লিখুন (YYYY-MM-DD):", defaultDate);
  if (!inputDate) return;

  const duty = prompt("আজকের Duty ঘণ্টা লিখুন (যেমন: 8):", "8");
  if (duty === null) return;

  const ot = prompt("আজকের OT ঘণ্টা লিখুন (যেমন: 2 বা 3.5):", "2");
  if (ot === null) return;

  const rate = prompt("প্রতি ঘণ্টা OT রেট (টাকা):", "60");
  if (rate === null) return;

  const dutyHours = parseFloat(duty) || 0;
  const otHours = parseFloat(ot) || 0;
  const hourlyRate = parseFloat(rate) || 0;
  const otPay = otHours * hourlyRate;

  // স্ক্রিনে আপডেট
  document.getElementById('today-duty').innerText = dutyHours;
  document.getElementById('today-ot').innerText = otHours;
  document.getElementById('today-ot-pay').innerText = otPay;

  const userId = localStorage.getItem('reliance_user_id') || '12373';

  db.ref('ot_records/' + userId + '/' + inputDate).set({
    date: inputDate,
    duty: dutyHours,
    ot: otHours,
    otPay: otPay,
    rate: hourlyRate,
    timestamp: Date.now()
  }).then(() => {
    alert('হিসাব সফলভাবে সেভ করা হয়েছে!');
    loadUserOTData(userId);
  });
}

// ৪. সংরক্ষিত সকল ডাটা লোড করা
function loadUserOTData(userId) {
  db.ref('ot_records/' + userId).on('value', (snap) => {
    let totalMonthMoney = 0;
    const todayKey = new Date().toISOString().split('T')[0];

    let historyHTML = '<table border="1" style="width:100%; text-align:center; border-collapse:collapse; font-size:13px; margin-top:8px;">';
    historyHTML += '<tr style="background:#0284c7; color:white;"><th>তারিখ</th><th>ডিউটি</th><th>OT</th><th>রেট</th><th>টাকা</th></tr>';

    if (snap.exists()) {
      snap.forEach((child) => {
        const item = child.val();
        totalMonthMoney += (item.otPay || 0);

        historyHTML += `<tr>
          <td style="padding:6px;">${item.date}</td>
          <td>${item.duty} ঘণ্টা</td>
          <td>${item.ot} ঘণ্টা</td>
          <td>৳${item.rate}</td>
          <td>৳${item.otPay}</td>
        </tr>`;

        if (child.key === todayKey) {
          document.getElementById('today-duty').innerText = item.duty || 0;
          document.getElementById('today-ot').innerText = item.ot || 0;
          document.getElementById('today-ot-pay').innerText = item.otPay || 0;
        }
      });
      historyHTML += '</table>';
    } else {
      historyHTML = '<p style="text-align:center; color:#777; padding:10px;">এখনো কোনো সেভ করা হিসাব নেই।</p>';
    }

    document.getElementById('month-total').innerText = totalMonthMoney;
    document.getElementById('ot-history-list').innerHTML = historyHTML;
  });
}

// ৫. কল ও হোয়াটসঅ্যাপ বাটন
function makeCall() {
  window.location.href = "tel:01734883213";
}

function openWhatsApp() {
  window.location.href = "https://wa.me/8801734883213";
}

