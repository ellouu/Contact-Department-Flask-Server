// DOM Elements
const tbody = document.querySelector('#departmentsTable tbody');
const addBtn = document.getElementById('addDeptBtn');
const deleteBtn = document.getElementById('deleteSelectedBtn');
const selectAll = document.getElementById('selectAll');
const modal = document.getElementById('deptModal');
const nameInput = document.getElementById('deptNameInput');
const saveBtn = document.getElementById('saveDeptBtn');
const cancelBtn = document.getElementById('cancelBtn');
const errorMsg = document.getElementById('errorMsg');
let editingDept = null;

// ESCAPE HTML
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// RELOAD TABLE
async function reloadDataAndRender() {
    const res = await fetch('/api/departments');
    const data = await res.json();
    tbody.innerHTML = '';
    data.forEach((c, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><input type="checkbox" class="rowCheckbox"></td>
                      <td>d${idx+1}</td>
                      <td>${escapeHtml(c.name)}</td>
                      <td><button class="editBtn">✏️ Edit</button></td>`;
        tbody.appendChild(tr);
    });
}

// EVENT DELEGATION FOR EDIT
tbody.addEventListener('click', e => {
    if(!e.target.classList.contains('editBtn')) return;
    const row = e.target.closest('tr');
    editingDept = {name: row.cells[2].innerText};
    nameInput.value = editingDept.name;
    errorMsg.textContent = '';
    modal.classList.add('open');
});

// MODAL
addBtn.addEventListener('click', () => {
    editingDept = null;
    nameInput.value = '';
    errorMsg.textContent = '';
    modal.classList.add('open');
});

cancelBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    errorMsg.textContent = '';
});

// SAVE DEPARTMENT
saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    errorMsg.textContent = '';
    if(!name) {
        errorMsg.textContent = 'Invalid name';
        return;
    }

    const payload = {name};
    if(editingDept) {
        payload.old_name = editingDept.name;
    }

    try {
        const r = await fetch('/departments/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const result = await r.json();

        if(!r.ok) {
            errorMsg.textContent = result.error || 'Server error';
            return;
        }

        await reloadDataAndRender();
        modal.classList.remove('open');
    } catch(err) {
        console.error(err);
        errorMsg.textContent = 'Network error';
    }
});

// DELETE
deleteBtn.addEventListener('click', async () => {
    const checkboxes = tbody.querySelectorAll('.rowCheckbox');
    const names = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.closest('tr').cells[2].innerText);

    if(names.length === 0) return;

    try {
        const r = await fetch('/departments/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({names})
        });
        if(r.ok) await reloadDataAndRender();
    } catch(err) {
        console.error(err);
    }
});

// SELECT ALL CHECKBOX
selectAll.addEventListener('change', () => {
    Array.from(tbody.querySelectorAll('.rowCheckbox')).forEach(cb => {
        cb.checked = selectAll.checked;
    });
});

// INITIAL LOAD
document.addEventListener('DOMContentLoaded', function() {
    reloadDataAndRender();
});