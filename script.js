class Department {
    constructor(id, name, manager, phone, employees, address) {
        this.id = id;
        this.name = name;
        this.manager = manager;
        this.phone = phone;
        this.employees = employees;
        this.address = address;
        this.additionalProperties = {};
    }

    addProperty(propertyName, propertyValue = "Не задано") {
        this.additionalProperties[propertyName] = propertyValue;
    }

    removeProperty(propertyName) {
        delete this.additionalProperties[propertyName];
    }
}

let departments = JSON.parse(localStorage.getItem('departments')) || [];
let currentEditId = null;
let historyLog = JSON.parse(localStorage.getItem('historyLog')) || [];

departments = departments.map(dept => {
    const department = new Department(
        dept.id, 
        dept.name, 
        dept.manager, 
        dept.phone, 
        dept.employees, 
        dept.address
    );
    if (dept.additionalProperties) {
        department.additionalProperties = dept.additionalProperties;
    }
    return department;
});

function generateId() {
    return departments.length ? Math.max(...departments.map(dep => dep.id)) + 1 : 1;
}

function updateHistory(action, id, details = null) {
    let entry = {
        action,
        id,
        details
    };
    
    historyLog.unshift(entry);
    localStorage.setItem('historyLog', JSON.stringify(historyLog));
    renderHistory();
}

function renderHistory() {
    const historyContainer = document.getElementById('history-log');
    historyContainer.innerHTML = '';
    
    if (historyLog.length === 0) {
        historyContainer.innerHTML = '<div class="history-entry">История изменений пуста</div>';
        return;
    }
    
    // Отображаем от старых к новым
    const reversedHistory = [...historyLog].reverse();
    
    reversedHistory.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'history-entry';
        
        let message = '';
        switch(entry.action) {
            case 'add':
                message = `Добавлена новая запись с ID ${entry.id}`;
                break;
            case 'edit':
                message = `Запись с ID ${entry.id} была изменена`;
                break;
            case 'delete':
                message = `Запись с ID ${entry.id} была удалена`;
                break;
            case 'property_add':
                message = `Добавлено новое свойство: ${entry.details}`;
                break;
            case 'property_remove':
                message = `Удалено свойство: ${entry.details}`;
                break;
            default:
                message = `Неизвестное действие`;
        }
        
        entryDiv.textContent = message;
        historyContainer.appendChild(entryDiv);
    });
}


function renderTable() {
    const tbody = document.querySelector("#department-table tbody");
    tbody.innerHTML = '';
    
    const thead = document.querySelector("#department-table thead");
    
    thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Название</th>
            <th>ФИО менеджера</th>
            <th>Телефон</th>
            <th>Кол-во сотрудников</th>
            <th>Юр. адрес</th>
        </tr>
    `;
    
    if (departments.length > 0) {
        const headerRow = thead.querySelector('tr');
        Object.keys(departments[0].additionalProperties).forEach(prop => {
            const th = document.createElement('th');
            th.textContent = prop;
            headerRow.appendChild(th);
        });
        
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Действия';
        headerRow.appendChild(actionsTh);
    } else {
        const headerRow = thead.querySelector('tr');
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Действия';
        headerRow.appendChild(actionsTh);
    }

    departments.forEach(dep => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${dep.id}</td>
            <td>${dep.name}</td>
            <td>${dep.manager}</td>
            <td>${dep.phone}</td>
            <td>${dep.employees}</td>
            <td>${dep.address}</td>
        `;
        
        Object.values(dep.additionalProperties).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });
        
        const actionsTd = document.createElement('td');
        actionsTd.innerHTML = `
            <button onclick="editDepartment(${dep.id})" class="edit-btn">Редактировать</button>
            <button onclick="removeDepartment(${dep.id})" class="delete-btn">Удалить</button>
        `;
        row.appendChild(actionsTd);
        
        tbody.appendChild(row);
    });

    updateDepartmentSelect();
    updatePropertySelect();
    updateFormFields();
}

function updateDepartmentSelect() {
    const select = document.getElementById("department-select");
    select.innerHTML = '<option value="">-- Выберите ID --</option>';
    departments.forEach(dep => {
        const option = document.createElement('option');
        option.value = dep.id;
        option.textContent = `ID: ${dep.id} - ${dep.name}`;
        select.appendChild(option);
    });
}

function updatePropertySelect() {
    const select = document.getElementById("property-select");
    select.innerHTML = '<option value="">-- Выберите свойство --</option>';
    
    if (departments.length > 0) {
        Object.keys(departments[0].additionalProperties).forEach(prop => {
            const option = document.createElement('option');
            option.value = prop;
            option.textContent = prop;
            select.appendChild(option);
        });
    }
}

function updateFormFields() {
    const formFields = document.getElementById("form-fields");
    const additionalFields = formFields.querySelectorAll('.additional-field');
    additionalFields.forEach(field => field.remove());
    
    if (departments.length > 0) {
        Object.keys(departments[0].additionalProperties).forEach(prop => {
            const group = document.createElement('div');
            group.className = 'form-group additional-field';
            group.innerHTML = `
                <label for="prop-${prop}">${prop}:</label>
                <input type="text" id="prop-${prop}" data-prop="${prop}">
            `;
            formFields.appendChild(group);
        });
    }
}

function fillFormForEdit(department) {
    document.getElementById("department-name").value = department.name;
    document.getElementById("manager-name").value = department.manager;
    document.getElementById("phone").value = department.phone;
    document.getElementById("employee-count").value = department.employees;
    document.getElementById("address").value = department.address;
    
    Object.entries(department.additionalProperties).forEach(([prop, value]) => {
        const input = document.querySelector(`#prop-${prop}`);
        if (input) input.value = value;
    });
    
    document.getElementById("add-record").style.display = 'none';
    document.getElementById("save-edit").style.display = 'inline-block';
    currentEditId = department.id;
}

function saveEditedDepartment() {
    if (currentEditId === null) return;
    
    const departmentIndex = departments.findIndex(dep => dep.id === currentEditId);
    if (departmentIndex === -1) return;
    
    const updatedDepartment = {
        id: currentEditId,
        name: document.getElementById("department-name").value,
        manager: document.getElementById("manager-name").value,
        phone: document.getElementById("phone").value,
        employees: document.getElementById("employee-count").value,
        address: document.getElementById("address").value,
        additionalProperties: {...departments[departmentIndex].additionalProperties}
    };
    
    Object.keys(updatedDepartment.additionalProperties).forEach(prop => {
        const input = document.querySelector(`#prop-${prop}`);
        if (input) {
            updatedDepartment.additionalProperties[prop] = input.value;
        }
    });
    
    departments[departmentIndex] = updatedDepartment;
    localStorage.setItem('departments', JSON.stringify(departments));
    updateHistory('edit', currentEditId);
    renderTable();
    
    document.getElementById("department-form").reset();
    document.getElementById("add-record").style.display = 'inline-block';
    document.getElementById("save-edit").style.display = 'none';
    currentEditId = null;
    
    alert("Изменения успешно сохранены!");
}

function editDepartment(id) {
    const department = departments.find(dep => dep.id === id);
    if (department) fillFormForEdit(department);
}

function removeDepartment(id) {
    if (confirm("Вы уверены, что хотите удалить эту запись?")) {
        departments = departments.filter(dep => dep.id !== id);
        localStorage.setItem('departments', JSON.stringify(departments));
        updateHistory('delete', id);
        renderTable();
    }
}

function addProperty() {
    const propertyName = document.getElementById("new-property").value.trim();
    const output = document.getElementById("property-output");
    
    if (!propertyName) {
        output.innerHTML = "<span style='color:red'>Введите название свойства!</span>";
        return;
    }
    
    if (departments.length > 0 && departments[0].additionalProperties[propertyName]) {
        output.innerHTML = `<span style='color:red'>Свойство "${propertyName}" уже существует!</span>`;
        return;
    }
    
    departments.forEach(dep => dep.addProperty(propertyName));
    localStorage.setItem('departments', JSON.stringify(departments));
    updateHistory('property_add', null, propertyName);
    
    output.innerHTML = `Добавлено новое свойство: <strong>${propertyName}</strong>`;
    document.getElementById("new-property").value = "";
    
    renderTable();
}

function removeProperty() {
    const propertyName = document.getElementById("property-select").value;
    if (!propertyName) {
        alert("Выберите свойство для удаления!");
        return;
    }
    
    if (confirm(`Вы уверены, что хотите удалить свойство "${propertyName}"?`)) {
        departments.forEach(dep => dep.removeProperty(propertyName));
        localStorage.setItem('departments', JSON.stringify(departments));
        updateHistory('property_remove', null, propertyName);
        
        document.getElementById("property-output").innerHTML = 
            `Удалено свойство: <strong>${propertyName}</strong>`;
        
        renderTable();
    }
}

function setupSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-input';
    searchInput.placeholder = 'Поиск по департаментам...';
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.appendChild(searchInput);
    
    const tableContainer = document.querySelector('.table-container');
    tableContainer.insertBefore(searchContainer, tableContainer.firstChild);
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#department-table tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

document.getElementById("department-form").addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (currentEditId !== null) {
        saveEditedDepartment();
        return;
    }
    
    const newDept = new Department(
        generateId(),
        document.getElementById("department-name").value,
        document.getElementById("manager-name").value,
        document.getElementById("phone").value,
        document.getElementById("employee-count").value,
        document.getElementById("address").value
    );
    
    if (departments.length > 0) {
        Object.keys(departments[0].additionalProperties).forEach(prop => {
            const input = document.querySelector(`#prop-${prop}`);
            newDept.addProperty(prop, input ? input.value : "Не задано");
        });
    }
    
    departments.push(newDept);
    localStorage.setItem('departments', JSON.stringify(departments));
    updateHistory('add', newDept.id);
    renderTable();
    this.reset();
});

document.getElementById("clear-form").addEventListener("click", function() {
    document.getElementById("department-form").reset();
    document.getElementById("add-record").style.display = 'inline-block';
    document.getElementById("save-edit").style.display = 'none';
    currentEditId = null;
});

document.getElementById("delete-record").addEventListener("click", function() {
    const select = document.getElementById("department-select");
    const selectedId = parseInt(select.value);
    
    if (selectedId && !isNaN(selectedId)) {
        removeDepartment(selectedId);
    } else {
        alert("Выберите запись для удаления!");
    }
});

document.getElementById("edit-record").addEventListener("click", function() {
    const select = document.getElementById("department-select");
    const selectedId = parseInt(select.value);
    
    if (selectedId && !isNaN(selectedId)) {
        editDepartment(selectedId);
    } else {
        alert("Выберите запись для редактирования!");
    }
});

document.getElementById("save-edit").addEventListener("click", saveEditedDepartment);

document.getElementById("show-managers").addEventListener("click", function() {
    if (departments.length === 0) {
        alert("Нет данных о департаментах!");
        return;
    }
    
    const maxEmployees = Math.max(...departments.map(dep => parseInt(dep.employees)));
    const minEmployees = Math.min(...departments.map(dep => parseInt(dep.employees)));
    
    const maxManagers = departments
        .filter(dep => parseInt(dep.employees) === maxEmployees)
        .map(dep => dep.manager);
    
    const minManagers = departments
        .filter(dep => parseInt(dep.employees) === minEmployees)
        .map(dep => dep.manager);
    
    let message = "Менеджеры департаментов:\n\n";
    message += `С максимальным количеством сотрудников (${maxEmployees}):\n`;
    message += maxManagers.join("\n") + "\n\n";
    message += `С минимальным количеством сотрудников (${minEmployees}):\n`;
    message += minManagers.join("\n");
    
    alert(message);
});

document.getElementById("add-property").addEventListener("click", addProperty);
document.getElementById("remove-property").addEventListener("click", removeProperty);

document.getElementById('clear-history').addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите очистить историю изменений?')) {
        historyLog = [];
        localStorage.removeItem('historyLog');
        renderHistory();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    renderTable();
    renderHistory();
    setupSearch();
});