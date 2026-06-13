/**
 * Theme & accent color management (localStorage only — no backend changes)
 */

const THEME_KEY = 'theme';
const ACCENT_KEY = 'accentColor';

function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    const accent = localStorage.getItem(ACCENT_KEY) || 'violet';
    document.documentElement.setAttribute('data-accent', accent);
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    syncThemeControls();
}

function setAccentColor(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem(ACCENT_KEY, accent);

    document.querySelectorAll('.accent-swatch').forEach(el => {
        el.classList.toggle('selected', el.dataset.accent === accent);
    });
}

function syncThemeControls() {
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
        btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
}

initTheme();
