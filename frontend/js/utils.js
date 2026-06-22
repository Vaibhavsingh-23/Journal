/**
 * Shared UI utilities — mood helpers, formatting, toasts
 */

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatDate(dateString, options) {
    const date = new Date(dateString);
    const defaults = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options || defaults);
}

function formatDateShort(dateString) {
    return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getEntryId(entry) {
    if (!entry || !entry.id) return '';
    if (typeof entry.id === 'object') {
        return String(entry.id.timestamp || entry.id.$oid || JSON.stringify(entry.id));
    }
    return String(entry.id);
}

function getMoodEmoji(mood) {
    const map = {
        Happy: '😊',
        Sad: '😔',
        Anxious: '😰',
        Grateful: '🙏',
        Excited: '🤩',
        Reflective: '🤔',
        Neutral: '😐',
        Angry: '😠',
        Calm: '😌'
    };
    return map[mood] || '📝';
}

function getMoodClass(mood) {
    return `mood-${(mood || 'neutral').toLowerCase()}`;
}

function getSentimentColor(score) {
    if (score >= 0.5) return 'sentiment-positive';
    if (score >= 0) return 'sentiment-neutral';
    return 'sentiment-negative';
}

function getSentimentPercent(score) {
    return ((score + 1) / 2) * 100;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

let toastTimer = null;

function showToast(message, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'toast';
        toast.setAttribute('role', 'alert');
        document.body.appendChild(toast);
    }

    if (toastTimer) clearTimeout(toastTimer);

    toast.className = `toast ${type}`;
    toast.textContent = message;
    void toast.offsetWidth;
    toast.classList.add('show');

    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

function requireAuth() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

async function checkIsAdmin() {
    // IMPORTANT: use raw fetch(), NOT apiFetch().
    // apiFetch() calls window.location.href = 'index.html' on 401/403,
    // which races with the form-submit flow and redirects the user
    // away from the analysis result card.
    try {
        const token = getToken();
        if (!token) return false;

        const res = await fetch(`${API_BASE_URL}/admin/all-user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.ok;   // true only for 2xx (i.e. real admin)
    } catch {
        return false;    // network error — assume not admin
    }
}

function extractThemesFromEntries(entries) {
    const moodCounts = {};
    entries.forEach(e => {
        const mood = e.mood || 'Neutral';
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    return Object.entries(moodCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([mood]) => mood);
}

function buildMoodChartData(entries) {
    const counts = {};
    entries.forEach(e => {
        const mood = e.mood || 'Unknown';
        counts[mood] = (counts[mood] || 0) + 1;
    });
    return {
        labels: Object.keys(counts),
        data: Object.values(counts)
    };
}

function buildWeeklyMoodTrend(entries) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = Array(7).fill(0);
    const counts = Array(7).fill(0);

    entries.forEach(e => {
        if (!e.date || e.sentimentScore == null) return;
        const d = new Date(e.date).getDay();
        sums[d] += e.sentimentScore;
        counts[d]++;
    });

    return {
        labels: days,
        data: sums.map((s, i) => (counts[i] ? (s / counts[i] + 1) / 2 * 100 : 0))
    };
}

const CHART_COLORS = [
    '#8b5cf6', '#6366f1', '#3b82f6', '#22c55e',
    '#f59e0b', '#ef4444', '#06b6d4', '#94a3b8'
];

function getChartColors(count) {
    return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
}
