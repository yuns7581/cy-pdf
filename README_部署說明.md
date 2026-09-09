# 現場工具箱 C1.2 — PWA 部署說明

## 檔案清單（6 個，全部放同一層）

| 檔案 | 用途 | 可否改名 |
|---|---|---|
| `index.html` | 工具箱本體（壓縮／標註／轉 PDF） | **不可**，GitHub Pages 靠這個名字當首頁 |
| `sw.js` | Service Worker，負責離線快取 | **不可**，`index.html` 內寫死路徑 |
| `manifest.webmanifest` | App 名稱、圖示、啟動方式 | **不可** |
| `icon-192.png` | 主畫面圖示 | 不建議 |
| `icon-512.png` | 高解析圖示、啟動畫面 | 不建議 |
| `icon-maskable-512.png` | Android 自適應圖示（會被裁成圓形／方形） | 不建議 |

本機備份請把 `index.html` 另存一份為 `20260909_現場工具箱_C1.2.html`，維持版次可追溯。

---

## 部署步驟

1. 進入 GitHub repo `yuns7581/cy-pdf`
2. **Add file → Upload files**，把上面 6 個檔案一次拖進去
3. 如果 repo 根目錄已經有舊的 `index.html`，直接覆蓋
4. Commit 後等 1–2 分鐘，開 `https://yuns7581.github.io/cy-pdf/`

> 若工具箱不想放在根目錄，可以建一個子資料夾（例如 `/tools/`）把 6 個檔案放進去，網址變成
> `https://yuns7581.github.io/cy-pdf/tools/`。manifest 和 SW 全部用相對路徑，子目錄一樣能跑。

---

## 安裝到手機

1. 用 **Chrome 或 Brave** 開 `https://yuns7581.github.io/cy-pdf/`
2. 標題列右邊會跳出「安裝」按鈕，按下去
3. 沒跳出來的話：瀏覽器選單 → **加到主畫面／安裝應用程式**
4. 裝完之後主畫面會有一個圖示，開啟時沒有網址列，就是一個獨立 App

安裝後**第一次開啟需要有網路**（下載並快取），之後完全離線可用。

---

## 更新流程

改完 `index.html` 之後，**一定要同步改 `sw.js` 第 3 行的版本號**：

```js
const CACHE = 'cy-toolbox-C1.2';   // → 改成 C1.3
```

不改這行的話，Service Worker 會繼續餵舊快取，你會以為更新沒生效。

改完上傳，使用者下次開啟時會在背景下載新版，並跳出「已下載新版本，關閉後重新開啟即可套用」。**再開一次**才會真的換版。

---

## 已知限制

- **iOS Safari**：可以「加入主畫面」並離線使用，但沒有安裝提示、沒有 `beforeinstallprompt`，且 Safari 會在長期未使用後清掉快取資料。標註工具的 IndexedDB 專案資料在 iOS 上不保證長期保留，重要案件請用「匯出 JSON」另存。
- **Brave**：Shields 預設不影響同源的 Service Worker，可正常運作。
- **file:// 直接開啟**：仍然可以用（會自動略過 SW 註冊），只是沒有離線快取和安裝功能，且未來若要加 Web Bluetooth，必須走 HTTPS 這條路。
- **這個網址是公開的**。工具本身不會上傳任何檔案（全程在裝置本機處理），但網址本身任何人都能開。裡面沒有客戶資料，只有程式碼，所以沒有合規問題；但別把含診所資料的匯出檔傳到這個 repo。
