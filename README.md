# CSV Editor - Electron Desktop Application

這是一個基於 Electron 的 CSV 表格編輯器，可以直接讀寫本地檔案系統的 CSV 檔案，支援中文內容。

## 功能特色

- 🖥️ **桌面應用程式**：基於 Electron 的跨平台桌面應用程式
- 📁 **路徑設定**：透過 DataPath.json 管理預設檔案路徑
- 💾 **即時儲存**：支援自動儲存和手動儲存功能
- 📊 **表格編輯**：支援新增、刪除、編輯表格列
- 🔄 **拖拉排序**：使用 SortableJS 實現拖拉重新排序功能
- 🎨 **現代化 UI**：使用 Bootstrap 5 和 Font Awesome 圖示
- 📱 **響應式設計**：支援不同螢幕尺寸
- 🇹🇼 **中文支援**：使用 UTF-8 with BOM 確保中文正確顯示
- 💾 **Word 風格儲存提示**：關閉時如有未儲存變更會提示儲存

## 專案結構

```
csv-editor/
├── package.json          # 專案配置和依賴
├── main.js              # Electron 主程序
├── preload.js           # 安全的 IPC 通信
├── renderer.html        # 渲染程序 HTML
├── renderer.js          # 渲染程序 JavaScript
├── styles.css           # 自定義樣式
├── DataPath.json        # 檔案路徑設定檔
├── README.md            # 說明文件
└── dist/                # 打包輸出目錄
```

## 安裝和運行

### 1. 安裝依賴

```bash
npm install
```

或使用批次檔：

```bash
.\install.bat
```

### 2. 開發模式運行

```bash
npm start
```

或開啟開發者工具：

```bash
npm run dev
```

或使用批次檔：

```bash
.\start.bat
```

### 3. 打包成 Windows 執行檔

```bash
npm run build:win
```

或使用批次檔：

```bash
.\build.bat
```

打包後的檔案會在 `dist` 目錄中。

## 使用說明

### 首次使用流程

1. **啟動應用程式**：應用程式會顯示路徑設定介面
2. **設定檔案路徑**：
   - 預設會載入 `DataPath.json` 中的路徑
   - 可以手動輸入或使用「Browse」按鈕選擇檔案
   - 點擊「Save Path」儲存路徑設定
3. **載入檔案**：點擊「Load File」載入 CSV 檔案
4. **開始編輯**：表格載入後即可開始編輯

### 基本操作

1. **編輯表格**：
   - 點擊「Add Row」按鈕新增資料
   - 直接在表格中編輯內容
   - 拖拉左側圖示重新排序列
   - 點擊刪除圖示移除列
2. **儲存檔案**：
   - 點擊「Save CSV」直接儲存到當前檔案
   - 點擊「Save As」選擇其他位置儲存
   - 關閉視窗時如有未儲存變更會提示儲存

### 檔案格式

CSV 檔案包含以下欄位：
- 日期 (YYYY/MM/DD 格式)
- 項目
- 項目描述
- 備註

### 設定檔說明

`DataPath.json` 包含：
```json
{
  "csvFilePath": "C:\\Users\\user\\Desktop\\Dairy\\data.csv",
  "lastUsedPath": "C:\\Users\\user\\Desktop\\Dairy\\data.csv"
}
```

- `csvFilePath`：預設的 CSV 檔案路徑
- `lastUsedPath`：最後使用的檔案路徑

## 開發指南

### 修改預設檔案路徑

編輯 `DataPath.json` 檔案或透過應用程式介面修改。

### 自定義樣式

編輯 `styles.css` 檔案來自定義應用程式外觀。

### 新增功能

1. 在 `renderer.js` 中新增前端功能
2. 在 `preload.js` 中新增 IPC 通信介面
3. 在 `main.js` 中實作主程序邏輯

## 打包設定

### Windows 打包

使用 `electron-builder` 進行打包：

```bash
npm run build:win
```

### 自定義圖示

將 `icon.ico` 檔案放在專案根目錄，或修改 `package.json` 中的圖示路徑。

### 安裝程式設定

在 `package.json` 的 `build.nsis` 區段中自定義安裝程式行為。

## 中文編碼支援

應用程式使用 UTF-8 with BOM 編碼來確保中文內容正確顯示：

- 讀取檔案時會自動處理 BOM
- 儲存檔案時會自動加入 BOM
- 支援中文檔案路徑

## 故障排除

### 常見問題

1. **檔案無法讀取**：
   - 檢查檔案路徑是否正確
   - 確認檔案權限
   - 檢查目錄是否存在

2. **中文顯示亂碼**：
   - 確認檔案使用 UTF-8 編碼
   - 應用程式會自動處理 BOM

3. **打包失敗**：
   - 確認 Node.js 版本相容性
   - 檢查網路連線（下載依賴）
   - 確認 Windows 建置工具已安裝

4. **批次檔亂碼**：
   - 所有批次檔已改為英文，避免編碼問題

### 開發者工具

在開發模式下，按 `F12` 開啟開發者工具進行除錯。

## 授權

MIT License

## 更新日誌

### v1.1.0
- 新增 DataPath.json 設定檔管理
- 改善 UX 流程，支援路徑設定
- 解決中文編碼問題（UTF-8 with BOM）
- 新增 Word 風格儲存提示
- 批次檔改為英文避免亂碼

### v1.0.0
- 初始版本
- 基本 CSV 編輯功能
- Electron 桌面應用程式
- 拖拉排序功能 
