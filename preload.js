const { contextBridge, ipcRenderer } = require('electron');

// 在 window 物件上暴露受保護的方法，讓渲染程序可以安全地使用
contextBridge.exposeInMainWorld('electronAPI', {
  // 讀取設定檔
  loadConfig: () => ipcRenderer.invoke('load-config'),
  
  // 儲存設定檔
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // 讀取 CSV 檔案
  readCSVFile: (filePath) => ipcRenderer.invoke('read-csv-file', filePath),
  
  // 儲存 CSV 檔案
  saveCSVFile: (csvContent) => ipcRenderer.invoke('save-csv-file', csvContent),
  
  // 顯示檔案選擇對話框
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // 顯示儲存對話框
  showSaveDialog: (csvContent) => ipcRenderer.invoke('show-save-dialog', csvContent),
  
  // 標記有未儲存的變更
  markUnsavedChanges: (hasChanges) => ipcRenderer.invoke('mark-unsaved-changes', hasChanges),
  
  // 監聽儲存路徑事件
  onSaveToPath: (callback) => ipcRenderer.on('save-to-path', callback)
}); 