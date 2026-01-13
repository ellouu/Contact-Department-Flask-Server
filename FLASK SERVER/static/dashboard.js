// Dashboard Statistics Management
class DashboardStats {
    constructor() {
        this.stats = {
            totalContacts: 0,
            totalDepartments: 0,
            totalAssignments: 0,
            activeContacts: 0,
            inactiveContacts: 0,
            waitingContacts: 0
        };
        this.init();
    }

    init() {
        this.loadStats();
        this.bindEvents();
    }

    async loadStats() {
        try {
            console.log("Loading dashboard statistics...");

            // Load all data in parallel
            const [contactsRes, departmentsRes, assignmentsRes] = await Promise.all([
                fetch('/api/data'),
                fetch('/api/departments'),
                fetch('/api/assignments')
            ]);

            const contacts = await contactsRes.json();
            const departments = await departmentsRes.json();
            const assignments = await assignmentsRes.json();

            console.log("Data loaded:", {
                contacts: contacts.length,
                departments: departments.length,
                assignments: assignments.length
            });

            // Calculate statistics
            this.stats = {
                totalContacts: contacts.length,
                totalDepartments: departments.length,
                totalAssignments: assignments.length,
                activeContacts: contacts.filter(c => c.status === 'active').length,
                inactiveContacts: contacts.filter(c => c.status === 'inactive').length,
                waitingContacts: contacts.filter(c => c.status === 'waiting').length
            };

            this.updateDisplay();
            this.updateProgressBars();

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showError();
        }
    }

    updateDisplay() {
        console.log("Updating display with stats:", this.stats);

        // Update top stats bar
        const contactsCount = document.getElementById('contactsCount');
        const departmentsCount = document.getElementById('departmentsCount');

        if (contactsCount) contactsCount.textContent = this.stats.totalContacts;
        if (departmentsCount) departmentsCount.textContent = this.stats.totalDepartments;

        // Update system overview
        const statContacts = document.getElementById('statContacts');
        const statDepartments = document.getElementById('statDepartments');
        const statActive = document.getElementById('statActive');

        if (statContacts) statContacts.textContent = this.stats.totalContacts;
        if (statDepartments) statDepartments.textContent = this.stats.totalDepartments;

        // Calculate active percentage
        const activePercentage = this.stats.totalContacts > 0
            ? Math.round((this.stats.activeContacts / this.stats.totalContacts) * 100)
            : 0;

        if (statActive) statActive.textContent = activePercentage + '%';

        console.log("Display updated successfully");
    }

    updateProgressBars() {
        // Calculate percentages for progress bars (using relative scaling)
        const contactsPercentage = Math.min(100, (this.stats.totalContacts / 50) * 100); // Scale to 50 contacts = 100%
        const departmentsPercentage = Math.min(100, (this.stats.totalDepartments / 20) * 100); // Scale to 20 departments = 100%
        const activePercentage = this.stats.totalContacts > 0
            ? Math.round((this.stats.activeContacts / this.stats.totalContacts) * 100)
            : 0;

        console.log("Progress percentages:", {
            contacts: contactsPercentage,
            departments: departmentsPercentage,
            active: activePercentage
        });

        // Update progress bars
        const contactsProgress = document.querySelector('.stat-progress.contacts');
        const departmentsProgress = document.querySelector('.stat-progress.departments');
        const activeProgress = document.querySelector('.stat-progress.active');

        if (contactsProgress) {
            contactsProgress.style.width = contactsPercentage + '%';
            contactsProgress.setAttribute('aria-valuenow', contactsPercentage);
        }

        if (departmentsProgress) {
            departmentsProgress.style.width = departmentsPercentage + '%';
            departmentsProgress.setAttribute('aria-valuenow', departmentsPercentage);
        }

        if (activeProgress) {
            activeProgress.style.width = activePercentage + '%';
            activeProgress.setAttribute('aria-valuenow', activePercentage);
        }
    }

    showError() {
        // Show error state in stats
        const elements = [
            'contactsCount', 'departmentsCount',
            'statContacts', 'statDepartments', 'statActive'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = 'Error';
        });
    }

    bindEvents() {
        // Refresh button event
        const refreshBtn = document.querySelector('[aria-label="Refresh dashboard data"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    refreshDashboard() {
        this.loadStats();
        // Add visual feedback
        const dashboard = document.querySelector('.dashboard');
        dashboard.style.animation = 'none';
        setTimeout(() => {
            dashboard.style.animation = 'fadeInUp 0.6s ease-out';
        }, 10);
    }
}

// Existing functionality
function handleFeatureCardKey(event, target) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (target === 'import') {
            showImportExport();
        } else {
            window.location.href = target;
        }
    }
}

function showImportExport() {
    showImportModal();
}

function showImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="file"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function hideImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        const importButton = document.querySelector('[aria-label="Import data from Excel file"]');
        if (importButton) importButton.focus();
    }
}

// Keyboard navigation and focus trap
document.addEventListener('DOMContentLoaded', function() {
    console.log("Dashboard initialized");

    // Initialize dashboard stats
    window.dashboardStats = new DashboardStats();

    const modal = document.getElementById('importModal');
    if (modal) {
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideImportModal();
            }

            if (e.key === 'Tab') {
                const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Add click outside to close modal
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('importModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            hideImportModal();
        }
    });
});

// Import form handling
document.addEventListener('DOMContentLoaded', function() {
    const importForm = document.getElementById("importForm");
    if (importForm) {
        importForm.addEventListener("submit", async e => {
            e.preventDefault();
            const fileInput = document.getElementById("importFile");
            if(!fileInput || !fileInput.files.length) {
                alert("Please choose a file first");
                return;
            }

            const formData = new FormData();
            formData.append("file", fileInput.files[0]);

            try {
                const res = await fetch("/import", {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();

                if(res.ok) {
                    if(data.skipped && data.skipped.length > 0){
                        alert("Import completed with some skipped entries:\n" + data.skipped.slice(0, 5).join("\n") +
                              (data.skipped.length > 5 ? "\n...and " + (data.skipped.length - 5) + " more" : ""));
                    } else {
                        alert("Import successful!");
                    }
                    hideImportModal();
                    // Refresh stats after import
                    if (window.dashboardStats) {
                        window.dashboardStats.refreshDashboard();
                    }
                } else {
                    alert("Import failed: " + (data.error || "Unknown error"));
                }
            } catch(err) {
                console.error(err);
                alert("Network error during import");
            }
        });
    }
});

// Global refresh function
function refreshDashboard() {
    if (window.dashboardStats) {
        window.dashboardStats.refreshDashboard();
    }
}