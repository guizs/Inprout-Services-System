const selectAllCheckbox = document.getElementById('selectAll');
const rowCheckboxes = document.querySelectorAll('.row-checkbox');

// Aplica ou remove a classe da linha conforme o checkbox
function toggleRowSelection(checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('selected');
    } else {
        row.classList.remove('selected');
    }
}

// Selecionar todos
selectAllCheckbox.addEventListener('change', function () {
    rowCheckboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
        toggleRowSelection(cb);
    });
});

// Seleção individual
rowCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        toggleRowSelection(cb);
    });
});