const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 保持對視窗物件的全域引用，避免 JavaScript 物件被垃圾回收時視窗被關閉
let mainWindow;
let currentFilePath = '';
let hasUnsavedChanges = false;

// 設定檔路徑
const CONFIG_FILE_PATH = path.join(__dirname, 'DataPath.json');

// 讀取設定檔
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE_PATH)) {
            const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    
    // 預設設定
    return {
        csvFilePath: path.join(process.env.USERPROFILE, 'Desktop', 'Dairy', 'data.csv'),
        lastUsedPath: path.join(process.env.USERPROFILE, 'Desktop', 'Dairy', 'data.csv')
    };
}

// 儲存設定檔
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving config:', error);
    }
}

function createWindow() {
    // 建立瀏覽器視窗
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'CSV Editor'
    });

    // 載入應用程式的 index.html
    mainWindow.loadFile('renderer.html');

    // 開發模式下開啟開發者工具
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // 當視窗被關閉時發出事件
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // 處理視窗關閉事件
    mainWindow.on('close', (event) => {
        if (hasUnsavedChanges) {
            event.preventDefault();
            showSaveDialog();
        }
    });
}

// 顯示儲存對話框
function showSaveDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Save', 'Don\'t Save', 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        title: 'Save Changes',
        message: 'Do you want to save your changes?'
    }).then((result) => {
        if (result.response === 0) {
            // Save
            if (currentFilePath) {
                saveCurrentFile();
            } else {
                showSaveAsDialog();
            }
        } else if (result.response === 1) {
            // Don't Save
            hasUnsavedChanges = false;
            mainWindow.close();
        }
        // Cancel - do nothing, window stays open
    });
}

// 儲存當前檔案
function saveCurrentFile() {
    if (!currentFilePath) return;
    
    ipcMain.handle('save-current-file', async (event, csvContent) => {
        try {
            // 確保目錄存在
            const dir = path.dirname(currentFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 使用 UTF-8 with BOM 來確保中文正確顯示
            const BOM = '\uFEFF';
            fs.writeFileSync(currentFilePath, BOM + csvContent, 'utf8');
            
            hasUnsavedChanges = false;
            return { success: true };
        } catch (error) {
            console.error('Error saving file:', error);
            return { success: false, error: error.message };
        }
    });
}

// 顯示另存新檔對話框
function showSaveAsDialog() {
    dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'data.csv'
    }).then((result) => {
        if (!result.canceled && result.filePath) {
            currentFilePath = result.filePath;
            // 更新設定檔
            const config = loadConfig();
            config.lastUsedPath = currentFilePath;
            saveConfig(config);
            
            // 通知渲染程序儲存檔案
            mainWindow.webContents.send('save-to-path', currentFilePath);
        }
    });
}

// 當 Electron 完成初始化並準備建立瀏覽器視窗時呼叫此方法
app.whenReady().then(createWindow);

// 當所有視窗都關閉時退出應用程式
app.on('window-all-closed', () => {
    // 在 macOS 上，當所有視窗都關閉時，應用程式通常會保持活動狀態
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在 macOS 上，當點擊 dock 圖示且沒有其他視窗開啟時，
    // 通常會在應用程式中重新建立一個視窗
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC 處理器 - 讀取設定檔
ipcMain.handle('load-config', async () => {
    return loadConfig();
});

// IPC 處理器 - 儲存設定檔
ipcMain.handle('save-config', async (event, config) => {
    saveConfig(config);
    return { success: true };
});

// IPC 處理器 - 讀取 CSV 檔案
ipcMain.handle('read-csv-file', async (event, filePath) => {
    try {
        const targetPath = filePath || loadConfig().csvFilePath;
        
        // 確保目錄存在
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 檢查檔案是否存在
        if (fs.existsSync(targetPath)) {
            const data = fs.readFileSync(targetPath, 'utf8');
            currentFilePath = targetPath;
            return { success: true, data, filePath: targetPath };
        } else {
            // 如果檔案不存在，建立空檔案
            const BOM = '\uFEFF';
            fs.writeFileSync(targetPath, BOM, 'utf8');
            currentFilePath = targetPath;
            return { success: true, data: '', filePath: targetPath };
        }
    } catch (error) {
        console.error('Error reading CSV file:', error);
        return { success: false, error: error.message };
    }
});

// IPC 處理器 - 儲存 CSV 檔案
ipcMain.handle('save-csv-file', async (event, csvContent) => {
    try {
        if (!currentFilePath) {
            return { success: false, error: 'No file path specified' };
        }

        // 確保目錄存在
        const dir = path.dirname(currentFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 使用 UTF-8 with BOM 來確保中文正確顯示
        const BOM = '\uFEFF';
        fs.writeFileSync(currentFilePath, BOM + csvContent, 'utf8');
        
        hasUnsavedChanges = false;
        return { success: true };
    } catch (error) {
        console.error('Error saving CSV file:', error);
        return { success: false, error: error.message };
    }
});

// IPC 處理器 - 顯示檔案選擇對話框
ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const filePath = result.filePaths[0];
            const data = fs.readFileSync(filePath, 'utf8');
            currentFilePath = filePath;
            
            // 更新設定檔
            const config = loadConfig();
            config.lastUsedPath = filePath;
            saveConfig(config);
            
            return { success: true, data, filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, canceled: true };
});

// IPC 處理器 - 顯示儲存對話框
ipcMain.handle('show-save-dialog', async (event, csvContent) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'data.csv'
    });

    if (!result.canceled && result.filePath) {
        try {
            const filePath = result.filePath;
            // 使用 UTF-8 with BOM 來確保中文正確顯示
            const BOM = '\uFEFF';
            fs.writeFileSync(filePath, BOM + csvContent, 'utf8');
            
            currentFilePath = filePath;
            hasUnsavedChanges = false;
            
            // 更新設定檔
            const config = loadConfig();
            config.lastUsedPath = filePath;
            saveConfig(config);
            
            return { success: true, filePath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false, canceled: true };
});

// IPC 處理器 - 標記有未儲存的變更
ipcMain.handle('mark-unsaved-changes', async (event, hasChanges) => {
    hasUnsavedChanges = hasChanges;
    return { success: true };
}); 