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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// --- ১. লাইভ কাউন্টার ---
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

// --- ২. অটো-লগইন এবং ইউজারের তথ্য সংরক্ষণ ---
window.onload = function() {
  const savedName = localStorage.getItem('reliance_user_name') || 'EMON';
  const savedId = localStorage.getItem('reliance_user_id') || '12373';

  updateUserDisplay(savedName, savedId);
  loadUserOTData(savedId);
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
    alert('পরিচয় সফলভাবে সংরক্ষণ করা হয়েছে!');
    loadUserOTData(id);
  } else {
    alert('দয়া করে নাম ও আইডি পূরণ করুন।');
  }
}

// --- ৩. আজকের হিসাব যোগ করা (OT Calculator Prompt) ---
function showAddRecordModal() {
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

  // স্ক্রিনে ইনস্ট্যান্ট আপডেট দেখানো
  document.getElementById('today-duty').innerText = dutyHours;
  document.getElementById('today-ot').innerText = otHours;
  document.getElementById('today-ot-pay').innerText = otPay;

  // ডাটাবেসে সেভ করা
  const userId = localStorage.getItem('reliance_user_id') || '12373';
  const todayKey = new Date().toISOString().split('T')[0];

  db.ref('ot_records/' + userId + '/' + todayKey).set({
    date: todayKey,
    duty: dutyHours,
    ot: otHours,
    otPay: otPay,
    rate: hourlyRate,
    timestamp: Date.now()
  }).then(() => {
    alert('আজকের হিসাব সফলভাবে জমা হয়েছে!');
    loadUserOTData(userId);
  }).catch((err) => {
    alert('হিসাব সেভ হতে সমস্যা হয়েছে: ' + err.message);
  });
}

// --- ৪. ইউজারের OT হিসাব লোড করা ---
function loadUserOTData(userId) {
  db.ref('ot_records/' + userId).on('value', (snap) => {
    let totalMonth = 0;
    const todayKey = new Date().toISOString().split('T')[0];

    if (snap.exists()) {
      snap.forEach((child) => {
        const item = child.val();
        totalMonth += (item.otPay || 0);

        if (child.key === todayKey) {
          document.getElementById('today-duty').innerText = item.duty || 0;
          document.getElementById('today-ot').innerText = item.ot || 0;
          document.getElementById('today-ot-pay').innerText = item.otPay || 0;
        }
      });
    }
    document.getElementById('month-total').innerText = totalMonth;
  });
}

// --- ৫. কল ও হোয়াটসঅ্যাপ হেল্পলাইন ---
function makeCall() {
  window.location.href = "tel:01700000000"; // এখানে আপনার সঠিক মোবাইল নম্বর দিন
}

function openWhatsApp() {
  window.location.href = "https://wa.me/8801700000000"; // এখানে আপনার হোয়াটসঅ্যাপ নম্বর দিন
}

// --- ৬. ফিডব্যাক পাঠানো ---
function sendFeedback() {
  const text = document.getElementById('feedback-text').value;
  const name = localStorage.getItem('reliance_user_name') || 'EMON';
  const id = localStorage.getItem('reliance_user_id') || '12373';

  if (text.trim() !== "") {
    db.ref('feedbacks').push({
      userName: name,
      userId: id,
      message: text,
      time: new Date().toLocaleString()
    });
    alert('আপনার মেসেজ সফলভাবে পাঠানো হয়েছে!');
    document.getElementById('feedback-text').value = '';
  } else {
    alert('দয়া করে কিছু লিখুন।');
  }
}

// --- ৭. নোটিশ আপডেট ---
db.ref('notices/latest').on('value', (snap) => {
  if (snap.exists()) {
    document.getElementById('notice-text').innerText = snap.val();
  }
});
