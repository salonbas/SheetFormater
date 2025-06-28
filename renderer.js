let sortable;
let currentFilePath = '';
let hasUnsavedChanges = false;

// 取得今天日期 (YYYY/MM/DD 格式)
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 轉換日期格式給 input[type="date"] 使用 (YYYY-MM-DD)
function formatDateForInput(dateStr) {
    if (!dateStr) return getTodayDate().replace(/\//g, '-');
    return dateStr.replace(/\//g, '-');
}

// 轉換日期格式給輸出使用 (YYYY/MM/DD)
function formatDateForOutput(dateStr) {
    if (!dateStr) return getTodayDate();
    return dateStr.replace(/-/g, '/');
}

// 初始化 SortableJS
function initSortable() {
    const tableBody = document.getElementById('tableBody');
    sortable = Sortable.create(tableBody, {
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        animation: 150
    });
}

// 新增一列
function addRow(date = '', item = '', description = '', note = '') {
    const tableBody = document.getElementById('tableBody');
    const defaultDate = date || getTodayDate();
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="text-center">
            <i class="fas fa-grip-vertical drag-handle"></i>
        </td>
        <td>
            <input type="date" value="${formatDateForInput(defaultDate)}" class="form-control-plaintext">
        </td>
        <td>
            <input type="text" value="${item}" placeholder="Enter item" class="form-control-plaintext">
        </td>
        <td>
            <textarea placeholder="Enter description" class="form-control-plaintext">${description}</textarea>
        </td>
        <td>
            <input type="text" value="${note}" placeholder="Enter note" class="form-control-plaintext">
        </td>
        <td class="text-center">
            <i class="fas fa-trash delete-btn" onclick="deleteRow(this)"></i>
        </td>
    `;
    
    tableBody.appendChild(row);
    markUnsavedChanges(true);
}

// 刪除列
function deleteRow(element) {
    element.closest('tr').remove();
    markUnsavedChanges(true);
}

// 清空表格
function clearTable() {
    if (confirm('Are you sure you want to clear the entire table? This action cannot be undone.')) {
        document.getElementById('tableBody').innerHTML = '';
        markUnsavedChanges(true);
    }
}

// 解析 CSV 內容 (支援 UTF-8 with BOM)
function parseCSV(csvText) {
    // 移除 BOM 如果存在
    if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.slice(1);
    }
    
    const lines = csvText.trim().split('\n');
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // 清空現有內容
    
    lines.forEach((line, index) => {
        // 簡單的 CSV 解析 (處理逗號分隔)
        const columns = parseCSVLine(line);
        
        if (columns.length >= 4) {
            addRow(columns[0], columns[1], columns[2], columns[3]);
        }
    });
    
    // 如果沒有資料，至少新增一列
    if (lines.length === 0 || lines[0].trim() === '') {
        addRow();
    }
    
    markUnsavedChanges(false);
}

// 解析 CSV 行 (處理引號內的逗號)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// 生成 CSV 內容
function generateCSV() {
    const rows = document.querySelectorAll('#tableBody tr');
    let csvContent = '';
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, textarea');
        const values = [];
        
        // 取得日期 (轉換為 YYYY/MM/DD 格式)
        values.push(formatDateForOutput(inputs[0].value));
        
        // 取得其他欄位
        for (let i = 1; i < inputs.length; i++) {
            let value = inputs[i].value.replace(/"/g, '""'); // 處理引號
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            values.push(value);
        }
        
        csvContent += values.join(',') + '\n';
    });
    
    return csvContent;
}

// 更新檔案狀態顯示
function updateFileStatus(message, type = 'info') {
    const fileStatus = document.getElementById('fileStatus');
    const fileStatusText = document.getElementById('fileStatusText');
    fileStatusText.textContent = message;
    fileStatus.className = `alert alert-${type}`;
    fileStatus.style.display = 'block';
}

// 顯示表格區域
function showTableArea() {
    document.getElementById('tableContainer').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'flex';
    document.getElementById('helpText').style.display = 'block';
    document.getElementById('pathSetupCard').style.display = 'none';
}

// 標記未儲存的變更
function markUnsavedChanges(hasChanges) {
    hasUnsavedChanges = hasChanges;
    window.electronAPI.markUnsavedChanges(hasChanges);
}

// 載入設定檔
async function loadConfig() {
    try {
        const config = await window.electronAPI.loadConfig();
        document.getElementById('csvFilePath').value = config.csvFilePath;
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

// 儲存設定檔
async function saveConfig(filePath) {
    try {
        const config = {
            csvFilePath: filePath,
            lastUsedPath: filePath
        };
        await window.electronAPI.saveConfig(config);
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

// 檢查檔案是否為 CSV
function isCSVFile(filePath) {
    return filePath.toLowerCase().endsWith('.csv');
}

// 開啟檔案
async function openFile() {
    const filePath = document.getElementById('csvFilePath').value.trim();
    
    if (!filePath) {
        alert('Please enter a file path first.');
        return;
    }
    
    if (!isCSVFile(filePath)) {
        alert('Error: File must be a CSV file (.csv extension)');
        return;
    }
    
    try {
        updateFileStatus(`Loading file: ${filePath}`, 'info');
        
        const result = await window.electronAPI.readCSVFile(filePath);
        
        if (result.success) {
            currentFilePath = result.filePath;
            
            // 自動儲存路徑到 DataPath.json
            await saveConfig(filePath);
            
            if (result.data.trim()) {
                parseCSV(result.data);
                updateFileStatus(`File loaded successfully from ${filePath}`, 'success');
            } else {
                addRow(); // 如果檔案為空，新增一列
                updateFileStatus(`File is empty, added blank row from ${filePath}`, 'info');
            }
            showTableArea();
        } else {
            updateFileStatus(`Failed to load file: ${result.error}`, 'error');
        }
    } catch (error) {
        updateFileStatus(`Error loading file: ${error.message}`, 'error');
    }
}

// 儲存 CSV 檔案
async function saveCSV() {
    try {
        const csvContent = generateCSV();
        
        if (csvContent.trim() === '') {
            alert('Table is empty, cannot save!');
            return;
        }
        
        const result = await window.electronAPI.saveCSVFile(csvContent);
        
        if (result.success) {
            updateFileStatus('File saved successfully!', 'success');
            markUnsavedChanges(false);
            setTimeout(() => {
                updateFileStatus(`File: ${currentFilePath}`, 'info');
            }, 2000);
        } else {
            updateFileStatus(`Failed to save file: ${result.error}`, 'error');
        }
    } catch (error) {
        updateFileStatus(`Error saving file: ${error.message}`, 'error');
    }
}

// 另存新檔
async function saveAs() {
    try {
        const csvContent = generateCSV();
        
        if (csvContent.trim() === '') {
            alert('Table is empty, cannot save!');
            return;
        }
        
        const result = await window.electronAPI.showSaveDialog(csvContent);
        
        if (result.success) {
            currentFilePath = result.filePath;
            updateFileStatus('File saved as successfully!', 'success');
            markUnsavedChanges(false);
            setTimeout(() => {
                updateFileStatus(`File: ${currentFilePath}`, 'info');
            }, 2000);
        } else if (!result.canceled) {
            updateFileStatus(`Failed to save file as: ${result.error}`, 'error');
        }
    } catch (error) {
        updateFileStatus(`Error saving file as: ${error.message}`, 'error');
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', function() {
    initSortable();
    
    // 載入設定檔
    loadConfig();
    
    // 檔案操作按鈕
    document.getElementById('openFileBtn').addEventListener('click', openFile);
    document.getElementById('saveAsBtn').addEventListener('click', saveAs);
    
    // 表格操作按鈕
    document.getElementById('addRowBtn').addEventListener('click', function() {
        addRow();
    });
    
    document.getElementById('saveBtn').addEventListener('click', saveCSV);
    document.getElementById('clearBtn').addEventListener('click', clearTable);
    
    // 監聽儲存路徑事件
    window.electronAPI.onSaveToPath((event, filePath) => {
        currentFilePath = filePath;
        saveCSV();
    });
    
    // 監聽輸入框變更
    document.getElementById('csvFilePath').addEventListener('input', function() {
        // 可以加入即時驗證邏輯
    });
}); 