/**
 * lang.js — i18n engine for ha516StudioDoc
 *
 * Usage:
 *   await i18n.init();          // call once on page load
 *   i18n.setLang('zh-TW');      // switch language & persist
 *   i18n.apply();               // re-apply after new DOM is injected
 */

const i18n = (() => {
    const STORAGE_KEY = 'ha516_lang';
    const DEFAULT_LANG = 'en';
    const SUPPORTED = ['en', 'zh-TW', 'zh-CN'];
    const LABELS = { en: 'EN', 'zh-TW': '繁中', 'zh-CN': '简中' };

    let translations = {};
    let currentLang = DEFAULT_LANG;

    // ── Helpers ──────────────────────────────────────────────────────────────

    function get(lang, keyPath) {
        const keys = keyPath.split('.');
        let node = translations[lang];
        for (const k of keys) {
            if (node == null) return null;
            node = node[k];
        }
        return node ?? null;
    }

    function t(keyPath) {
        return get(currentLang, keyPath) ?? get(DEFAULT_LANG, keyPath) ?? keyPath;
    }

    // ── Core ─────────────────────────────────────────────────────────────────

    async function init() {
        // Determine language from localStorage → browser → default
        const stored = localStorage.getItem(STORAGE_KEY);
        const browser = navigator.language; // e.g. "zh-TW", "zh", "en-US"
        const browserBase = browser?.split('-')[0]; // "zh", "en"

        if (stored && SUPPORTED.includes(stored)) {
            currentLang = stored;
        } else if (SUPPORTED.includes(browser)) {
            currentLang = browser;
        } else if (browser?.startsWith('zh-TW') || browser?.startsWith('zh-HK')) {
            currentLang = 'zh-TW';
        } else if (browserBase === 'zh') {
            currentLang = 'zh-CN';
        } else {
            currentLang = DEFAULT_LANG;
        }

        await loadTranslations();
        renderPicker();
        apply();
    }

    async function loadTranslations() {
        if (Object.keys(translations).length > 0) return; // already cached
        // Resolve path relative to root regardless of current page depth
        const base = document.querySelector('base')?.href ?? location.origin + '/';
        const url = new URL('translations.json', base).href;
        try {
            const resp = await fetch(url);
            translations = await resp.json();
        } catch (e) {
            console.error('[i18n] Failed to load translations.json', e);
        }
    }

    function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        apply();
        // Update picker active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        // Update <html lang>
        document.documentElement.lang = lang;
    }

    /**
     * Apply translations to the current DOM.
     * Elements declare their key via data-i18n="section.key"
     * Optional: data-i18n-attr="placeholder" to translate an attribute instead of textContent.
     * Optional: data-i18n-html="section.key" to set innerHTML (for rich text with <br> etc.)
     */
    function apply(root = document) {
        document.documentElement.lang = currentLang;

        root.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const val = t(key);
            if (val !== null) el.textContent = val;
        });

        root.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.dataset.i18nHtml;
            const val = t(key);
            if (val !== null) el.innerHTML = val;
        });

        root.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const attr = el.dataset.i18nAttr;
            const key = el.dataset.i18n;
            const val = t(key);
            if (val !== null) el.setAttribute(attr, val);
        });
    }

    // ── Language Picker UI ────────────────────────────────────────────────────

    function renderPicker() {
        const slot = document.getElementById('lang-picker');
        if (!slot) return;
        slot.innerHTML = '';
        SUPPORTED.forEach(lang => {
            const btn = document.createElement('button');
            btn.className = 'lang-btn' + (lang === currentLang ? ' active' : '');
            btn.textContent = LABELS[lang];
            btn.dataset.lang = lang;
            btn.setAttribute('aria-label', `Switch language to ${LABELS[lang]}`);
            btn.addEventListener('click', () => setLang(lang));
            slot.appendChild(btn);
        });
    }

    // ── Public API ────────────────────────────────────────────────────────────

    return { init, setLang, apply, t, get current() { return currentLang; } };
})();
