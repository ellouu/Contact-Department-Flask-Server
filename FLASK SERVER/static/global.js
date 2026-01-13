// Global Accessibility Management
class AccessibilityManager {
    constructor() {
        this.settings = {
            theme: 'dark',
            colorVision: 'normal',
            fontSize: 1,
            dyslexiaFont: false,
            simplifiedLayout: false
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.bindEvents();
        this.applySettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    }

    bindEvents() {
        // Toggle accessibility panel
        const toggleBtn = document.getElementById('accessibilityToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel();
            });
        }

        // Close panel when clicking outside
        document.addEventListener('click', () => {
            this.closePanel();
        });

        // Theme buttons
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTheme(e.target.dataset.theme);
            });
        });

        // Color vision buttons
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setColorVision(e.target.dataset.color);
            });
        });

        // Font size controls
        const fontDecrease = document.getElementById('fontDecrease');
        const fontIncrease = document.getElementById('fontIncrease');

        if (fontDecrease) {
            fontDecrease.addEventListener('click', () => {
                this.changeFontSize(-0.125);
            });
        }

        if (fontIncrease) {
            fontIncrease.addEventListener('click', () => {
                this.changeFontSize(0.125);
            });
        }

        // Additional features
        const toggleDyslexia = document.getElementById('toggleDyslexia');
        const toggleSimplified = document.getElementById('toggleSimplified');

        if (toggleDyslexia) {
            toggleDyslexia.addEventListener('click', () => {
                this.toggleDyslexiaFont();
            });
        }

        if (toggleSimplified) {
            toggleSimplified.addEventListener('click', () => {
                this.toggleSimplifiedLayout();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetAccessibility');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    togglePanel() {
        const panel = document.getElementById('accessibilityPanel');
        const toggle = document.getElementById('accessibilityToggle');
        if (panel && toggle) {
            const isOpen = panel.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen);

            if (isOpen) {
                this.updateActiveButtons();
            }
        }
    }

    closePanel() {
        const panel = document.getElementById('accessibilityPanel');
        const toggle = document.getElementById('accessibilityToggle');
        if (panel && toggle) {
            panel.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    }

    updateActiveButtons() {
        // Update theme buttons
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });

        // Update color vision buttons
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.settings.colorVision);
        });

        // Update font size display
        const fontSizeDisplay = document.getElementById('fontSizeDisplay');
        if (fontSizeDisplay) {
            fontSizeDisplay.textContent = Math.round(this.settings.fontSize * 100) + '%';
        }

        // Update additional features
        const toggleDyslexia = document.getElementById('toggleDyslexia');
        const toggleSimplified = document.getElementById('toggleSimplified');

        if (toggleDyslexia) {
            toggleDyslexia.classList.toggle('active', this.settings.dyslexiaFont);
        }
        if (toggleSimplified) {
            toggleSimplified.classList.toggle('active', this.settings.simplifiedLayout);
        }
    }

    setTheme(theme) {
        document.body.classList.remove('dark-theme', 'light-theme', 'high-contrast');
        document.body.classList.add(theme + '-theme');
        this.settings.theme = theme;
        this.saveSettings();
        this.updateActiveButtons();
    }

    setColorVision(mode) {
        document.body.classList.remove(
            'colorblind-protanopia',
            'colorblind-deuteranopia',
            'colorblind-tritanopia',
            'high-contrast'
        );

        if (mode !== 'normal') {
            document.body.classList.add('colorblind-' + mode);
        }

        this.settings.colorVision = mode;
        this.saveSettings();
        this.updateActiveButtons();
    }

    changeFontSize(delta) {
        this.settings.fontSize = Math.max(0.875, Math.min(1.5, this.settings.fontSize + delta));
        document.documentElement.style.setProperty('--font-scale', this.settings.fontSize);
        document.body.style.fontSize = `calc(${getComputedStyle(document.documentElement).getPropertyValue('--font-size-base')} * ${this.settings.fontSize})`;
        this.saveSettings();
        this.updateActiveButtons();
    }

    toggleDyslexiaFont() {
        this.settings.dyslexiaFont = !this.settings.dyslexiaFont;
        document.body.classList.toggle('dyslexia-font', this.settings.dyslexiaFont);

        if (this.settings.dyslexiaFont) {
            document.body.style.fontFamily = 'Comic Sans MS, Arial, sans-serif';
        } else {
            document.body.style.fontFamily = 'Inter, sans-serif';
        }

        this.saveSettings();
        this.updateActiveButtons();
    }

    toggleSimplifiedLayout() {
        this.settings.simplifiedLayout = !this.settings.simplifiedLayout;
        document.body.classList.toggle('simplified-layout', this.settings.simplifiedLayout);

        if (this.settings.simplifiedLayout) {
            // Add simplified layout styles
            const style = document.createElement('style');
            style.id = 'simplified-layout-styles';
            style.textContent = `
                .feature-card, .table-container, .stat-item {
                    border: 2px solid var(--primary) !important;
                }
                .action-btn, .btn {
                    border: 2px solid !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            const style = document.getElementById('simplified-layout-styles');
            if (style) style.remove();
        }

        this.saveSettings();
        this.updateActiveButtons();
    }

    resetSettings() {
        this.settings = {
            theme: 'dark',
            colorVision: 'normal',
            fontSize: 1,
            dyslexiaFont: false,
            simplifiedLayout: false
        };

        document.body.className = '';
        document.body.style.fontFamily = '';
        document.documentElement.style.setProperty('--font-scale', '1');

        const style = document.getElementById('simplified-layout-styles');
        if (style) style.remove();

        this.saveSettings();
        this.updateActiveButtons();
        this.closePanel();
    }

    applySettings() {
        this.setTheme(this.settings.theme);
        this.setColorVision(this.settings.colorVision);
        document.documentElement.style.setProperty('--font-scale', this.settings.fontSize);

        if (this.settings.dyslexiaFont) {
            document.body.classList.add('dyslexia-font');
            document.body.style.fontFamily = 'Comic Sans MS, Arial, sans-serif';
        }

        if (this.settings.simplifiedLayout) {
            this.toggleSimplifiedLayout();
        }

        this.updateActiveButtons();
    }
}

// Initialize accessibility manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.accessibilityManager = new AccessibilityManager();
});