/**
 * Shared SaaS layout — sidebar, mobile drawer, auth guard hook
 */

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: 'dashboard.html' },
    { id: 'entries', label: 'Entries', icon: '📝', href: 'entries.html' },
    { id: 'new-entry', label: 'New Entry', icon: '➕', href: 'create-entry.html' },
    { id: 'analytics', label: 'Analytics', icon: '📈', href: 'dashboard.html#analytics' },
    { id: 'settings', label: 'Settings', icon: '⚙️', href: 'settings.html' },
    { id: 'admin', label: 'Admin', icon: '👑', href: 'admin.html', adminOnly: true }
];

function initAppLayout(activePage) {
    if (!requireAuth()) return;

    const username = getUsername() || 'User';
    const initials = username.slice(0, 2).toUpperCase();

    const shell = document.createElement('div');
    shell.className = 'app-shell';
    shell.innerHTML = `
        <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>
        <aside class="sidebar" id="sidebar" aria-label="Main navigation">
            <div class="sidebar-brand">
                <a href="dashboard.html" class="sidebar-brand-link">
                    <span class="sidebar-brand-icon" aria-hidden="true">📖</span>
                    <span>My Journal</span>
                </a>
            </div>
            <div class="sidebar-user">
                <div class="sidebar-user-name">${escapeHtml(username)}</div>
                <div class="sidebar-user-meta">Personal workspace</div>
            </div>
            <nav class="sidebar-nav" id="sidebarNav"></nav>
            <div class="sidebar-footer">
                <button type="button" class="sidebar-link logout" id="sidebarLogout">
                    <span class="sidebar-link-icon" aria-hidden="true">🚪</span>
                    Logout
                </button>
            </div>
        </aside>
        <div class="main-wrapper">
            <header class="mobile-header">
                <button type="button" class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">☰</button>
                <span class="mobile-brand">My Journal</span>
                <span class="mobile-avatar" style="width:36px;height:36px;border-radius:10px;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">${escapeHtml(initials)}</span>
            </header>
            <main class="main-content" id="mainContent"></main>
        </div>
    `;

    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    document.body.insertBefore(shell, document.body.firstChild);
    const mainContent = document.getElementById('mainContent');
    mainContent.appendChild(pageContent);
    pageContent.style.display = 'block';

    const nav = document.getElementById('sidebarNav');
    NAV_ITEMS.forEach(item => {
        const isActive = activePage === item.id ||
            (activePage === 'entry-details' && item.id === 'entries') ||
            (activePage === 'create-entry' && item.id === 'new-entry');

        const el = document.createElement('a');
        el.href = item.href;
        el.className = `sidebar-link${isActive ? ' active' : ''}${item.adminOnly ? ' admin-only' : ''}`;
        el.dataset.page = item.id;
        el.innerHTML = `
            <span class="sidebar-link-icon" aria-hidden="true">${item.icon}</span>
            ${item.label}
        `;
        nav.appendChild(el);
    });

    document.getElementById('sidebarLogout').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) logout();
    });

    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');

    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('visible');
        overlay.setAttribute('aria-hidden', 'false');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
        overlay.setAttribute('aria-hidden', 'true');
    }

    menuBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    nav.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    checkIsAdmin().then(isAdmin => {
        if (isAdmin) {
            nav.querySelectorAll('.admin-only').forEach(el => el.classList.add('visible'));
        }
    });
}

function initAuthLayout() {
    initTheme();
}
