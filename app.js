<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reliance Job & OT</title>
  <link rel="stylesheet" href="style.css">
  <link rel="manifest" href="manifest.json">
</head>
<body>

  <!-- লাইভ ইউজার কাউন্টার -->
  <div class="stats-bar">
    <div class="stat-item">🟢 অনলাইন ইউজার: <span id="live-online">1</span></div>
    <div class="stat-item">👁️ মোট ভিজিটর: <span id="total-visitors">1</span></div>
  </div>

  <!-- অ্যাপ হেডার -->
  <header class="app-header">
    <h2>🕒 Reliance Job & OT</h2>
    <p class="sub-title">RELIANCE DRESSES LIMITED</p>
    <div class="user-badge"><span id="disp-badge-name">EMON</span> (ID: <span id="disp-badge-id">12373</span>)</div>
  </header>

  <div class="container">
    <!-- তারিখ প্রদর্শন -->
    <div class="date-card">
      📅 আজ: <span id="current-date-str">শুক্রবার, ৯ অক্টোবর, ২০২৬</span>
    </div>

    <!-- ১. হোম ট্যাব -->
    <div id="tab-home" class="tab-page">
      <!-- পরিচয় ও বেতন ইনপুট কার্ড -->
      <div class="card" id="user-card">
        <h3>✍️ আপনার পরিচয় ও বেতন ইনপুট দিন</h3>
        <div id="login-form">
          <input type="text" id="user-name" value="EMON" placeholder="আপনার নাম">
          <input type="text" id="user-id" value="12373" placeholder="আপনার আইডি">
          <input type="number" id="user-basic" placeholder="মূল/বেসিক বেতন (টাকা)">
          <input type="number" id="user-allowance" placeholder="সরকারি/অন্যান্য ভাতা (টাকা)">
          <button class="btn-info" onclick="saveUserInfo()">সংরক্ষণ করুন</button>
        </div>
      </div>

      <!-- মূল ৪টি হিসাবের কার্ড -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">আজকের Duty</div>
          <div class="stat-value"><span id="today-duty">0</span> ঘণ্টা</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">আজকের OT</div>
          <div class="stat-value"><span id="today-ot">0</span> ঘণ্টা</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">আজকের OT পে</div>
          <div class="stat-value">৳<span id="today-ot-pay">0</span></div>
        </div>
        <div class="stat-card green-card">
          <div class="stat-title">এই মাসের মোট OT</div>
          <div class="stat-value">৳<span id="month-total">0</span></div>
        </div>
      </div>

      <!-- হিসাব যোগ করার বাটন -->
      <button class="btn-primary" onclick="showAddRecordModal()">➕ আজকের হিসাব যোগ করুন</button>

      <!-- তারিখ অনুযায়ী সংরক্ষিত হিসাবের তালিকা -->
      <div class="card">
        <h3>📋 আপনার সংরক্ষিত হিসাব তালিকা</h3>
        <div id="ot-history-list">
          <p style="text-align:center; color:#777; padding:10px;">কোনো হিসাব পাওয়া যায়নি।</p>
        </div>
      </div>
    </div>

    <!-- ২. ক্যালেন্ডার ট্যাব -->
    <div id="tab-calendar" class="tab-page" style="display:none;">
      <div class="card">
        <h3>📅 মাসিক ক্যালেন্ডার হিসাব</h3>
        <p style="font-size:13px; color:#666; margin-bottom:10px;">এখানে আপনার প্রতিদিনের ডিউটি ও ওটি জমা থাকবে।</p>
        <div id="calendar-history-list"></div>
      </div>
    </div>

    <!-- ৩. রিপোর্ট ট্যাব (মাসিক হিসাব ও মোট বেতন) -->
    <div id="tab-report" class="tab-page" style="display:none;">
      <div class="card">
        <h3>📊 মাসিক বেতনের বিস্তারিত রিপোর্ট</h3>
        <div style="line-height:2; font-size:14px;">
          <p><strong>মূল/বেসিক বেতন:</strong> ৳<span id="rep-basic">0</span></p>
          <p><strong>সরকারি/অন্যান্য ভাতা:</strong> ৳<span id="rep-allowance">0</span></p>
          <p><strong>মোট ওটি (OT) টাকা:</strong> ৳<span id="rep-ot-pay">0</span></p>
          <hr style="margin:10px 0; border:0; border-top:1px solid #ddd;">
          <h3 style="color:#16a34a;">সর্বমোট প্রাক্কলিত বেতন: ৳<span id="rep-total-salary">0</span></h3>
        </div>
      </div>
    </div>
  </div>

  <!-- বটম নেভিগেশন বার -->
  <div class="bottom-nav">
    <div class="nav-item active" onclick="switchTab('home', this)">🏠<br>হোম</div>
    <div class="nav-item" onclick="switchTab('calendar', this)">📅<br>ক্যালেন্ডার</div>
    <div class="nav-item" onclick="switchTab('report', this)">📈<br>রিপোর্ট</div>
  </div>

  <!-- হেল্পলাইন বার -->
  <div class="contact-bar">
    <button class="btn-whatsapp" onclick="openWhatsApp()">💬 হোয়াটসঅ্যাপ সাপোর্ট</button>
    <button class="btn-call" onclick="makeCall()">📞 কল হেল্পলাইন</button>
  </div>

  <!-- Firebase JS -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
  <script src="app.js"></script>
</body>
</html>
