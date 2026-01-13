// COMPANY COORDINATES
const COMPANY_COORDINATES = { lat: 40.84313201523982, lng: 22.895167239425863 };

console.log("Contacts JavaScript loaded");

// DOM Elements
let tbody, addBtn, deleteBtn, selectAll, searchInput, modal, nameInput, phoneInput, locationInput, saveBtn, cancelBtn, errorMsg, cvFileInput;

let editingContact = null;
let currentCVPhone = null;

// CACHE FOR DISTANCES
const distanceCache = new Map();

// RATE LIMITING FOR GEOCODING
let lastGeocodeRequest = 0;

// Interview Tracking Data Structure
const interviewData = JSON.parse(localStorage.getItem('interviewData')) || {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - Initializing contacts page");

    // Initialize DOM elements
    initializeDOMElements();

    if (!tbody) {
        console.error("Table body not found!");
        return;
    }

    initializeInterviewData();
    bindInterviewEvents();
    bindContactEvents();
    reloadDataAndRender();
});

function initializeDOMElements() {
    tbody = document.querySelector('#contactsTable tbody');
    addBtn = document.getElementById('addContactBtn');
    deleteBtn = document.getElementById('deleteSelectedBtn');
    selectAll = document.getElementById('selectAll');
    searchInput = document.getElementById('searchInput');
    modal = document.getElementById('contactModal');
    nameInput = document.getElementById('nameInput');
    phoneInput = document.getElementById('phoneInput');
    locationInput = document.getElementById('locationInput');
    saveBtn = document.getElementById('saveContactBtn');
    cancelBtn = document.getElementById('cancelBtn');
    errorMsg = document.getElementById('errorMsg');
    cvFileInput = document.getElementById('cvFileInput');

    console.log("DOM Elements initialized:", {
        tbody: !!tbody,
        addBtn: !!addBtn,
        deleteBtn: !!deleteBtn,
        modal: !!modal
    });
}

// INTERVIEW TRACKING FUNCTIONS
function initializeInterviewData() {
    try {
        const contacts = window.contactsData || [];
        console.log("Initializing interview data for", contacts.length, "contacts");

        contacts.forEach(contact => {
            if (!interviewData[contact.phone]) {
                interviewData[contact.phone] = {
                    progress: 0,
                    rating: '3', // Default to 3 stars
                    stars: '⭐⭐⭐',
                    notes: '',
                    scheduledDate: null
                };
            }
        });
        saveInterviewData();
        renderInterviewData();
    } catch (error) {
        console.error("Error initializing interview data:", error);
    }
}

function saveInterviewData() {
    localStorage.setItem('interviewData', JSON.stringify(interviewData));
}

function renderInterviewData() {
    document.querySelectorAll('.interview-timeline').forEach(timeline => {
        const phone = timeline.dataset.phone;
        const data = interviewData[phone];
        if (data) {
            const progress = timeline.querySelector('.timeline-progress');
            const marker = timeline.querySelector('.timeline-marker');
            if (progress) progress.style.width = data.progress + '%';
            if (marker) marker.style.left = data.progress + '%';
        }
    });

    document.querySelectorAll('.rating-dropdown').forEach(dropdown => {
        const row = dropdown.closest('tr');
        const phone = row.dataset.phone;
        const data = interviewData[phone];
        if (data) {
            const display = dropdown.querySelector('.rating-display');
            const stars = display.querySelector('.rating-stars');
            const text = display.querySelector('span:last-child');

            if (stars && text) {
                stars.textContent = data.stars || '⭐⭐⭐';

                switch(data.rating) {
                    case '1':
                        text.textContent = '1 Star';
                        break;
                    case '2':
                        text.textContent = '2 Stars';
                        break;
                    case '3':
                        text.textContent = '3 Stars';
                        break;
                    case '4':
                        text.textContent = '4 Stars';
                        break;
                    case '5':
                        text.textContent = '5 Stars';
                        break;
                    default:
                        text.textContent = '3 Stars';
                }
            }
        }
    });
}

function bindInterviewEvents() {
    console.log("Binding interview events");

    // Timeline Interaction
    document.querySelectorAll('.interview-timeline').forEach(timeline => {
        timeline.addEventListener('click', function(e) {
            if (e.target.classList.contains('timeline-marker')) return;

            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = (clickX / rect.width) * 100;
            const progress = Math.max(0, Math.min(100, percentage));

            const phone = this.dataset.phone;
            if (interviewData[phone]) {
                interviewData[phone].progress = progress;
            }

            const progressBar = this.querySelector('.timeline-progress');
            const marker = this.querySelector('.timeline-marker');
            if (progressBar) progressBar.style.width = progress + '%';
            if (marker) marker.style.left = progress + '%';

            saveInterviewData();
        });

        const marker = timeline.querySelector('.timeline-marker');
        if (marker) {
            marker.addEventListener('mousedown', startDrag);
        }
    });

    // Close dropdowns when clicking anywhere else on the page
document.addEventListener('click', function(e) {
    if (!e.target.closest('.rating-dropdown')) {
        document.querySelectorAll('.rating-options').forEach(options => {
            options.style.display = 'none';
        });
    }
});

// Close dropdowns when pressing Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.rating-options').forEach(options => {
            options.style.display = 'none';
        });
    }
});

    // Rating Dropdown - SIMPLE VERSION
document.querySelectorAll('.rating-display').forEach(display => {
    display.addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = this.parentElement;
        const options = dropdown.querySelector('.rating-options');

        // Close all other open dropdowns
        document.querySelectorAll('.rating-options').forEach(otherOptions => {
            if (otherOptions !== options) {
                otherOptions.style.display = 'none';
            }
        });

        // Toggle current dropdown
        if (options.style.display === 'flex') {
            options.style.display = 'none';
        } else {
            options.style.display = 'flex';
        }
    });
});

document.querySelectorAll('.rating-option').forEach(option => {
    option.addEventListener('click', function() {
        const dropdown = this.closest('.rating-dropdown');
        const row = dropdown.closest('tr');
        const phone = row.dataset.phone;
        const rating = this.dataset.rating;
        const stars = this.dataset.stars;

        interviewData[phone].rating = rating;
        interviewData[phone].stars = stars;

        const display = dropdown.querySelector('.rating-display');
        const starsElement = display.querySelector('.rating-stars');
        const text = display.querySelector('span:last-child');

        if (starsElement && text) {
            starsElement.textContent = stars;

            switch(rating) {
                case '1':
                    text.textContent = '1 Star';
                    break;
                case '2':
                    text.textContent = '2 Stars';
                    break;
                case '3':
                    text.textContent = '3 Stars';
                    break;
                case '4':
                    text.textContent = '4 Stars';
                    break;
                case '5':
                    text.textContent = '5 Stars';
                    break;
            }
        }

        dropdown.querySelector('.rating-options').style.display = 'none';
        saveInterviewData();
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.rating-dropdown')) {
        document.querySelectorAll('.rating-options').forEach(options => {
            options.style.display = 'none';
        });
    }
});

// Close dropdowns with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.rating-options').forEach(options => {
            options.style.display = 'none';
        });
    }
});

    // Schedule Interview
    document.querySelectorAll('.scheduleBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const phone = this.dataset.phone;
            const row = this.closest('tr');
            const contactName = row.querySelector('td:first-child').textContent;

            document.getElementById('scheduleContactName').value = contactName;
            document.getElementById('scheduleModal').classList.add('open');
            document.getElementById('scheduleModal').dataset.currentPhone = phone;
        });
    });

    // Notes Button
    document.querySelectorAll('.notesBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const phone = this.dataset.phone;
            const row = this.closest('tr');
            const contactName = row.querySelector('td:first-child').textContent;
            const data = interviewData[phone];

            document.getElementById('notesContactName').value = contactName;
            document.getElementById('interviewNotes').value = data?.notes || '';
            document.getElementById('notesModal').classList.add('open');
            document.getElementById('notesModal').dataset.currentPhone = phone;
        });
    });

    // Save Schedule
    const saveScheduleBtn = document.getElementById('saveScheduleBtn');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', function() {
            const phone = document.getElementById('scheduleModal').dataset.currentPhone;
            const dateTime = document.getElementById('interviewDateTime').value;
            const notes = document.getElementById('scheduleNotes').value;

            if (dateTime && interviewData[phone]) {
                interviewData[phone].scheduledDate = dateTime;
                interviewData[phone].progress = 50;
                saveInterviewData();
                renderInterviewData();
            }

            document.getElementById('scheduleModal').classList.remove('open');
        });
    }

    // Save Notes
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', function() {
            const phone = document.getElementById('notesModal').dataset.currentPhone;
            const notes = document.getElementById('interviewNotes').value;

            if (interviewData[phone]) {
                interviewData[phone].notes = notes;
                saveInterviewData();
            }
            document.getElementById('notesModal').classList.remove('open');
        });
    }

    // Cancel buttons
    const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
    if (cancelScheduleBtn) {
        cancelScheduleBtn.addEventListener('click', function() {
            document.getElementById('scheduleModal').classList.remove('open');
        });
    }

    const cancelNotesBtn = document.getElementById('cancelNotesBtn');
    if (cancelNotesBtn) {
        cancelNotesBtn.addEventListener('click', function() {
            document.getElementById('notesModal').classList.remove('open');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.rating-options').forEach(options => {
            options.style.display = 'none';
        });
    });
}

function startDrag(e) {
    e.preventDefault();
    const marker = e.target;
    const timeline = marker.parentElement;
    const phone = timeline.dataset.phone;

    function drag(e) {
        const rect = timeline.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const percentage = (x / rect.width) * 100;

        if (interviewData[phone]) {
            interviewData[phone].progress = percentage;
        }
        const progressBar = timeline.querySelector('.timeline-progress');
        if (progressBar) progressBar.style.width = percentage + '%';
        if (marker) marker.style.left = percentage + '%';
    }

    function stopDrag() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        saveInterviewData();
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

// CONTACT MANAGEMENT FUNCTIONS
function bindContactEvents() {
    console.log("Binding contact events");

    if (!tbody) {
        console.error("Table body not found for binding events");
        return;
    }

    // Edit contact
    tbody.addEventListener('click', e => {
        if(e.target.classList.contains('editBtn')){
            console.log("Edit button clicked");
            const row = e.target.closest('tr');
            const cells = row.cells;
            editingContact = {
                name: cells[3].innerText,
                phone: cells[4].innerText,
                location: cells[5].innerText,
                status: cells[2].querySelector('.status-dot').classList.contains('active') ? 'active' :
                       cells[2].querySelector('.status-dot').classList.contains('inactive') ? 'inactive' : 'waiting'
            };
            nameInput.value = editingContact.name;
            phoneInput.value = editingContact.phone;
            locationInput.value = editingContact.location;
            document.getElementById('statusSelect').value = editingContact.status;

            errorMsg.textContent = '';
            modal.classList.add('open');
        }

        if(e.target.classList.contains('cvUploadBtn')){
            console.log("CV Upload button clicked");
            const row = e.target.closest('tr');
            currentCVPhone = e.target.dataset.phone || row.cells[4].innerText;
            cvFileInput.click();
        }

        if(e.target.classList.contains('cvViewBtn')) {
            console.log("CV View button clicked");
            const row = e.target.closest('tr');
            const rawName = e.target.dataset.name || row.cells[3].innerText;
            const safeName = rawName.replace(/[^A-Za-zΑ-Ωα-ωΆΈΊΎΏΉάέίόύώή0-9]/g, '_');
            const url = '/cv/' + encodeURIComponent(safeName);
            window.open(url, '_blank');
        }

        if(e.target.classList.contains('mapBtn')) {
            console.log("Map button clicked");
            const row = e.target.closest('tr');
            const location = e.target.dataset.location || row.cells[5].innerText;
            if(location && location.trim() !== '') {
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(location)}&destination=${COMPANY_COORDINATES.lat},${COMPANY_COORDINATES.lng}&travelmode=driving`;
                window.open(mapsUrl, '_blank');
            } else {
                alert('No location specified for this contact');
            }
        }
    });

    // CV file upload
    if (cvFileInput) {
        cvFileInput.addEventListener('change', async () => {
            const file = cvFileInput.files[0];
            if(!file) return;
            const row = Array.from(tbody.rows).find(r => {
                const phoneCell = r.cells[4];
                return phoneCell && phoneCell.innerText === currentCVPhone;
            });
            const name = row ? row.cells[3].innerText : "";
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name);
            formData.append('phone', currentCVPhone);
            try {
                const res = await fetch('/contacts/upload_cv', {method:'POST', body:formData});
                const result = await res.json();
                if(result.success) alert(`CV uploaded: ${result.filename}`);
                else alert(result.error);
            } catch(err) {
                alert('Upload failed: ' + err.message);
            }
            cvFileInput.value = '';
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            Array.from(tbody.rows).forEach(r => {
                const name = r.cells[3].innerText.toLowerCase();
                const phone = r.cells[4].innerText.toLowerCase();
                const location = r.cells[5].innerText.toLowerCase();
                r.style.display = (name.includes(query) || phone.includes(query) || location.includes(query)) ? "" : "none";
            });
        });
    }

    // Select all
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            Array.from(tbody.querySelectorAll('.rowCheckbox')).forEach(cb => cb.checked = selectAll.checked);
        });
    }

    // Input validation
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            nameInput.value = nameInput.value.replace(/[^A-Za-z\u0370-\u03FF\u1F00-\u1FFF ]/gu,'').slice(0,30);
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/\D/g,'').slice(0,10);
        });
    }

    // Add contact
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            console.log("Add contact button clicked");
            editingContact = null;
            nameInput.value = '';
            phoneInput.value = '';
            locationInput.value = '';
            document.getElementById('statusSelect').value = 'waiting';
            errorMsg.textContent = '';
            modal.classList.add('open');
        });
    }

    // Cancel modal
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('open');
            errorMsg.textContent = '';
        });
    }

    // Save contact
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            console.log("Save contact button clicked");
            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const location = locationInput.value.trim();
            const status = document.getElementById('statusSelect').value;

            errorMsg.textContent = '';
            const nameRegex = /^[A-Za-z\u0370-\u03FF\u1F00-\u1FFF ]{1,30}$/u;
            const phoneRegex = /^69[0-9]{8}$/;

            if(!nameRegex.test(name)) {
                errorMsg.textContent = 'Invalid name';
                return;
            }
            if(!phoneRegex.test(phone)) {
                errorMsg.textContent = 'Invalid phone';
                return;
            }

            const payload = {name, phone, location, status};
            if(editingContact) {
                payload.old_name = editingContact.name;
                payload.old_phone = editingContact.phone;
            }

            try {
                const r = await fetch('/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const result = await r.json();

                if(!r.ok) {
                    errorMsg.textContent = result.error || 'Server error';
                    return;
                }

                modal.classList.remove('open');
                await reloadDataAndRender();

            } catch(err) {
                console.error('Save error:', err);
                errorMsg.textContent = 'Network error - please check your connection';
            }
        });
    }

    // Delete contacts
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            console.log("Delete contacts button clicked");
            const checkboxes = tbody.querySelectorAll('.rowCheckbox');
            const phones = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => {
                    const row = cb.closest('tr');
                    return row.cells[4].innerText;
                });

            if(phones.length === 0) return;

            try {
                const r = await fetch('/delete', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({phones})
                });
                if(r.ok) await reloadDataAndRender();
            } catch(err) {
                console.error(err);
                alert('Delete failed');
            }
        });
    }
}

// UTILITY FUNCTIONS
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function geocodeLocation(location) {
    if (!location || location.trim() === '') {
        return null;
    }

    try {
        const now = Date.now();
        if (now - lastGeocodeRequest < 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000 - (now - lastGeocodeRequest)));
        }

        lastGeocodeRequest = Date.now();

        const searchQuery = location.includes('Ελλάδα') || location.includes('Greece') ?
            location : `${location}, Greece`;

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gr&limit=1`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);

            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Invalid coordinates received for location:', location);
                return null;
            }

            return { lat, lng };
        }

        console.warn('No geocoding results for location:', location);
        return null;
    } catch (error) {
        console.error('Geocoding error for location:', location, error);
        return null;
    }
}

function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
        return NaN;
    }

    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
}

async function calculateDistance(contactLocation) {
    if (!contactLocation || contactLocation.trim() === '') {
        return { distance: null, error: 'No location specified' };
    }

    const cacheKey = contactLocation.toLowerCase().trim();
    if (distanceCache.has(cacheKey)) {
        return distanceCache.get(cacheKey);
    }

    try {
        const contactCoords = await geocodeLocation(contactLocation);

        if (!contactCoords) {
            const result = { distance: null, error: 'Location not found' };
            distanceCache.set(cacheKey, result);
            return result;
        }

        const distance = calculateHaversineDistance(
            contactCoords.lat, contactCoords.lng,
            COMPANY_COORDINATES.lat, COMPANY_COORDINATES.lng
        );

        if (isNaN(distance)) {
            const result = { distance: null, error: 'Invalid distance calculation' };
            distanceCache.set(cacheKey, result);
            return result;
        }

        const result = {
            distance: Math.round(distance * 10) / 10,
            error: null,
            distanceText: `${Math.round(distance * 10) / 10} km`
        };
        distanceCache.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error('Distance calculation error:', error);
        const result = { distance: null, error: 'Calculation failed' };
        distanceCache.set(cacheKey, result);
        return result;
    }
}

function formatDistance(distance, distanceText = null) {
    if (distance === null) return 'N/A';
    return distanceText || `${distance} km`;
}

async function updateDistanceDisplay(distanceElement, contactLocation) {
    distanceElement.textContent = 'Calculating...';
    distanceElement.className = 'distance-display distance-loading';

    try {
        const result = await calculateDistance(contactLocation);

        if (result.error) {
            if (result.error === 'No location specified') {
                distanceElement.textContent = 'No location';
                distanceElement.className = 'distance-display';
            } else {
                distanceElement.textContent = result.error;
                distanceElement.className = 'distance-display distance-error';
            }
        } else if (result.distance !== null) {
            const formattedDistance = formatDistance(result.distance, result.distanceText);
            distanceElement.textContent = `${formattedDistance} from company`;

            if (result.distance < 15) {
                distanceElement.className = 'distance-display distance-ok';
            } else if (result.distance < 40) {
                distanceElement.className = 'distance-display distance-far';
            } else {
                distanceElement.className = 'distance-display distance-error';
            }
        } else {
            distanceElement.textContent = 'N/A';
            distanceElement.className = 'distance-display';
        }
    } catch (error) {
        console.error('Distance display error:', error);
        distanceElement.textContent = 'Error';
        distanceElement.className = 'distance-display distance-error';
    }
}

async function reloadDataAndRender() {
    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        tbody.innerHTML = '';
        data.forEach((c, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><input type="checkbox" class="rowCheckbox"></td>
        <td>c${idx+1}</td>
        <td>
            <div class="status-dot ${c.status === 'active' ? 'active' : c.status === 'inactive' ? 'inactive' : 'waiting'}"
                 title="${c.status || 'waiting'}"></div>
        </td>
        <td style="text-align:left; padding-left:18px;">${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone)}</td>
        <td>${escapeHtml(c.location || '')}</td>
        <td><button class="editBtn">✏️ Edit</button></td>
        <td>
            <button class="cvUploadBtn" data-phone="${escapeHtml(c.phone)}">📝 Upload</button>
            <button class="cvViewBtn" data-name="${escapeHtml(c.name)}">👁️ View</button>
        </td>
        <td>
            <button class="mapBtn" data-location="${escapeHtml(c.location || '')}">📍 Map</button>
            <div class="distance-display">Calculating...</div>
        </td>`;
            tbody.appendChild(tr);

            const distanceElement = tr.querySelector('.distance-display');
            updateDistanceDisplay(distanceElement, c.location || '');
        });

        console.log("Data reloaded and rendered:", data.length, "contacts");
    } catch (error) {
        console.error("Error reloading data:", error);
    }
}