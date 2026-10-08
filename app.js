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

// --- ১. লাইভ অনলাইন ইউজার ও ভিজিটর কাউন্টার ---
const onlineRef = db.ref('presence/' + Date.now());
const connectedRef = db.ref('.info/connected');

connectedRef.on('value', (snap) => {
  if (snap.val() === true) {
    onlineRef.onDisconnect().remove();
    onlineRef.set(true);
  }
});

// লাইভ ইউজার আপডেট দেখা
db.ref('presence').on('value', (snap) => {
  const count = snap.numChildren();
  document.getElementById('live-online').innerText = count;
});

// মোট ভিজিটর কাউন্টার
const visitorRef = db.ref('stats/totalVisitors');
visitorRef.transaction((current) => (current || 0) + 1);
visitorRef.on('value', (snap) => {
  document.getElementById('total-visitors').innerText = snap.val() || 0;
});

// --- ২. আজীবন অটো-লগইন ব্যবস্থা ---
window.onload = function() {
  const savedName = localStorage.getItem('reliance_user_name');
  const savedId = localStorage.getItem('reliance_user_id');

  if (savedName && savedId) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('user-display').style.display = 'block';
    document.getElementById('disp-name').innerText = savedName;
    document.getElementById('disp-id').innerText = savedId;
  }
};

function saveUserInfo() {
  const name = document.getElementById('user-name').value;
  const id = document.getElementById('user-id').value;

  if (name && id) {
    localStorage.setItem('reliance_user_name', name);
    localStorage.setItem('reliance_user_id', id);
    
    // ফায়ারবেসে ইউজার সেভ করা
    db.ref('users/' + id).set({
      name: name,
      joinedAt: new Date().toISOString()
    });

    location.reload();
  } else {
    alert('দয়া করে নাম এবং আইডি উভয়ই পূরণ করুন।');
  }
}

// --- ৩. ফিডব্যাক ও সাহায্য পাঠান ---
function sendFeedback() {
  const text = document.getElementById('feedback-text').value;
  const name = localStorage.getItem('reliance_user_name') || 'অজ্ঞাত';
  const id = localStorage.getItem('reliance_user_id') || 'N/A';

  if (text.trim() !== "") {
    db.ref('feedbacks').push({
      userName: name,
      userId: id,
      message: text,
      time: new Date().toLocaleString()
    });
    alert('আপনার বার্তা সফলভাবে পাঠানো হয়েছে!');
    document.getElementById('feedback-text').value = '';
  } else {
    alert('দয়া করে কিছু লিখুন।');
  }
}

// --- ৪. নোটিশ বোর্ড রিয়েলটাইম আপডেট ---
db.ref('notices/latest').on('value', (snap) => {
  if (snap.exists()) {
    document.getElementById('notice-text').innerText = snap.val();
  }
});
