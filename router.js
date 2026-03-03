/**
 * router.js — Hash-based SPA router for ha516StudioDoc
 *
 * Routes:
 *   #/                  → pages/home.html
 *   #/round-evolution   → pages/round-evolution.html
 *   #/deletion          → pages/deletion.html
 *   #/privacy-policy    → pages/privacy-policy.html
 *   #/terms             → pages/terms-and-conditions.html
 */

const router = (() => {
    const ROUTES = {
        '/': 'pages/home.html',
        '/round-evolution': 'pages/round-evolution.html',
        '/deletion': 'pages/deletion.html',
        '/privacy-policy': 'pages/privacy-policy.html',
        '/terms': 'pages/terms-and-conditions.html',
    };

    const DEFAULT_ROUTE = '/';
    let currentRoute = null;

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getHash() {
        // Normalize: "#/foo" → "/foo", "" → "/"
        const h = location.hash.replace(/^#/, '') || '/';
        return h.startsWith('/') ? h : '/' + h;
    }

    function getBase() {
        return document.querySelector('base')?.href ?? location.origin + '/';
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    async function navigate(path) {
        if (path === currentRoute) return; // no-op if same page
        currentRoute = path;

        const file = ROUTES[path] ?? ROUTES[DEFAULT_ROUTE];
        const url = new URL(file, getBase()).href;

        const content = document.getElementById('content');
        if (!content) return;

        // Fade out
        content.style.opacity = '0';

        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const html = await resp.text();

            // Small delay so the fade is visible
            await new Promise(r => setTimeout(r, 80));

            content.innerHTML = html;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'instant' });

            // Apply translations to the new fragment
            if (typeof i18n !== 'undefined') i18n.apply(content);
        } catch (e) {
            console.error('[router] Failed to load fragment:', file, e);
            content.innerHTML = '<p style="padding:2rem;text-align:center;">Page not found.</p>';
        }

        // Fade in
        content.style.transition = 'opacity 0.2s ease';
        content.style.opacity = '1';
    }

    async function handleRoute() {
        const path = getHash();
        // Strip query-string / trailing slash variants for matching
        const clean = path.replace(/\/$/, '') || '/';
        await navigate(ROUTES[clean] ? clean : DEFAULT_ROUTE);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute(); // handle initial load
    }

    function go(path) {
        location.hash = '#' + path;
    }

    return { init, go };
})();
