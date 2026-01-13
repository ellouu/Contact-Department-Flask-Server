// DOM Elements
const contactSelect = document.getElementById('contactSelect');
const deptSelect = document.getElementById('deptSelect');
const assignBtn = document.getElementById('assignBtn');
const tbody = document.querySelector('#assignmentsTable tbody');

async function loadAssignments() {
    // First refresh assignments to ensure consistency
    await fetch('/api/assignments/refresh');

    const res = await fetch('/api/assignments');
    const data = await res.json();
    tbody.innerHTML = '';
    data.forEach((a, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${idx+1}</td>
                        <td>${a.contact_name}</td>
                        <td>${a.department_name}</td>
                        <td><button class="deleteBtn" data-index="${idx}">❌ Delete</button></td>`;
        tbody.appendChild(tr);
    });
}

async function refreshDropdowns() {
    // Refresh contacts dropdown
    const contactsRes = await fetch('/api/data');
    const contacts = await contactsRes.json();
    contactSelect.innerHTML = '<option value="">Select Contact</option>';
    contacts.forEach((c, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = c.name;
        contactSelect.appendChild(option);
    });

    // Refresh departments dropdown
    const deptsRes = await fetch('/api/departments');
    const departments = await deptsRes.json();
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    departments.forEach((d, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = d.name;
        deptSelect.appendChild(option);
    });
}

assignBtn.addEventListener('click', async () => {
    const contactIndex = parseInt(contactSelect.value);
    const deptIndex = parseInt(deptSelect.value);
    if (isNaN(contactIndex) || isNaN(deptIndex)) {
        alert("Select both contact and department");
        return;
    }

    try {
        const res = await fetch('/assignments/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contact_index: contactIndex, dept_index: deptIndex})
        });
        const result = await res.json();
        if (!res.ok) {
            alert(result.error || 'Server error');
            return;
        }
        // reset dropdowns after successful assign
        contactSelect.value = "";
        deptSelect.value = "";
        await loadAssignments();
    } catch(err) {
        console.error(err);
        alert('Network error');
    }
});

tbody.addEventListener('click', async e => {
    if (!e.target.classList.contains('deleteBtn')) return;
    const index = parseInt(e.target.dataset.index);
    try {
        const res = await fetch('/assignments/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({index})
        });
        if (res.ok) await loadAssignments();
    } catch(err) {
        console.error(err);
    }
});

// Refresh everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    refreshDropdowns();
    loadAssignments();

    // Add event listener to refresh assignments when returning to this page
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page is visible again, refresh data
            refreshDropdowns();
            loadAssignments();
        }
    });
});