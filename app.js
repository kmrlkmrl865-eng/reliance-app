// Local Storage Keys
const STORAGE_KEY_ENTRIES = 'reliance_ot_entries';
const STORAGE_KEY_USER = 'reliance_user_info';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initLiveDate();
    loadUserProfile();
    renderHomeSummary();
    
    // Set default month for report
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);
    const reportMonthInput = document.getElementById('report-month-select');
    if (reportMonthInput) {
        reportMonthInput.value = currentMonthStr;
        renderReport();
    }
});

// Display Live Date and Day
function initLiveDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayStr = new Date().toLocaleDateString('bn-BD', options);
    const dateElement = document.getElementById('current-date-text');
    if (dateElement) {
        dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> আজ: ${todayStr}`;
    }
}

// Save & Load User Profile
function saveUserProfile() {
    const name = document.getElementById('user-name-input').value;
    const id = document.getElementById('user-id-input').value;
    const userInfo = { name, id };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));
    updateUserBadge(name, id);
}

function loadUserProfile() {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
        const userInfo = JSON.parse(saved);
        if (document.getElementById('user-name-input')) document.getElementById('user-name-input').value = userInfo.name || '';
        if (document.getElementById('user-id-input')) document.getElementById('user-id-input').value = userInfo.id || '';
        updateUserBadge(userInfo.name, userInfo.id);
    }
}

function updateUserBadge(name, id) {
    document.getElementById('display-user-name').innerText = name || 'শ্রমিক নাম';
    document.getElementById('display-user-id').innerText = id ? `ID: ${id}` : 'ID: ---';
}

// Tab Switching
function switchTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');

    if (tabId === 'tab-report') {
        renderReport();
    }
}

// Modal Control
function openEntryModal() {
    document.getElementById('entry-modal').style.display = 'block';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('entry-date').value = today;
    checkFridayLogic();
}

function closeEntryModal() {
    document.getElementById('entry-modal').style.display = 'none';
}

// Auto Friday Logic
function checkFridayLogic() {
    const dateVal = document.getElementById('entry-date').value;
    if (!dateVal) return;

    const selectedDate = new Date(dateVal);
    const dayOfWeek = selectedDate.getDay(); // 5 = Friday
    
    const dayNames = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    document.getElementById('day-name-display').innerText = `(${dayNames[dayOfWeek]})`;

    const fridayNotice = document.getElementById('friday-notice');
    const dutyInput = document.getElementById('entry-duty');
    const otInput = document.getElementById('entry-ot');

    if (dayOfWeek === 5) { // Friday
        fridayNotice.style.display = 'block';
        dutyInput.value = 0; // No basic duty deduction
        otInput.value = 8;   // Auto 8 Hours OT
    } else {
        fridayNotice.style.display = 'none';
        dutyInput.value = 8;
        otInput.value = 0;
    }
}

// Save Daily Entry
function saveDailyEntry() {
    const date = document.getElementById('entry-date').value;
    const duty = parseFloat(document.getElementById('entry-duty').value) || 0;
    const ot = parseFloat(document.getElementById('entry-ot').value) || 0;

    if (!date) {
        alert('অনুগ্রহ করে একটি তারিখ নির্বাচন করুন।');
        return;
    }

    let entries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '{}');
    entries[date] = { duty, ot };
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));

    closeEntryModal();
    renderHomeSummary();
    alert('হিসাব সফলভাবে সেভ করা হয়েছে!');
}

// Render Summary on Home Screen
function renderHomeSummary() {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '{}');
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.slice(0, 7);

    // Today's Data
    const todayData = entries[todayStr] || { duty: 0, ot: 0 };
    document.getElementById('sum-today-duty').innerText = `${todayData.duty} ঘণ্টা`;
    document.getElementById('sum-today-ot').innerText = `${todayData.ot} ঘণ্টা`;

    // Calculation Rate (Est. 50 Tk per OT hour - adjust as needed)
    const otRate = 50; 
    document.getElementById('sum-today-otpay').innerText = `৳${todayData.ot * otRate}`;

    // Monthly Calculation
    let monthOT = 0;
    Object.keys(entries).forEach(date => {
        if (date.startsWith(currentMonthStr)) {
            monthOT += entries[date].ot || 0;
        }
    });

    document.getElementById('sum-month-total').innerText = `৳${monthOT * otRate}`;
}

// Calendar Detail
function loadCalendarDetail() {
    const selectedDate = document.getElementById('calendar-date-select').value;
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '{}');
    const detailBox = document.getElementById('calendar-detail');

    if (entries[selectedDate]) {
        const item = entries[selectedDate];
        detailBox.innerHTML = `
            <p><strong>তারিখ:</strong> ${selectedDate}</p>
            <p><strong>ডিউটি:</strong> ${item.duty} ঘণ্টা</p>
            <p><strong>ওটি (OT):</strong> ${item.ot} ঘণ্টা</p>
        `;
    } else {
        detailBox.innerHTML = `<p class="text-light">এই তারিখে কোনো তথ্য সেভ করা নেই।</p>`;
    }
}

// Monthly Report & PDF Generation
function renderReport() {
    const selectedMonth = document.getElementById('report-month-select').value;
    if (!selectedMonth) return;

    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY_ENTRIES) || '{}');
    let totalDuty = 0;
    let totalOT = 0;

    Object.keys(entries).forEach(date => {
        if (date.startsWith(selectedMonth)) {
            totalDuty += entries[date].duty || 0;
            totalOT += entries[date].ot || 0;
        }
    });

    const otRate = 50; // OT Rate per hour
    const totalOTPay = totalOT * otRate;

    document.getElementById('rep-duty').innerText = `${totalDuty} ঘণ্টা`;
    document.getElementById('rep-ot').innerText = `${totalOT} ঘণ্টা`;
    document.getElementById('rep-otpay').innerText = `৳${totalOTPay}`;
    document.getElementById('rep-total').innerText = `৳${totalOTPay}`;
}

// Download Report as PDF
function downloadPDFReport() {
    const element = document.getElementById('pdf-report-area');
    const opt = {
        margin:       10,
        filename:     'Reliance_Job_OT_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
