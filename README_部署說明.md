# 現場工具箱 C2.0 — PWA 部署說明

## 檔案清單（7 個，全部放同一層）

| 檔案 | 用途 | 可否改名 |
|---|---|---|
| `index.html` | 工具箱本體（壓縮／標註／轉 PDF） | **不可**，GitHub Pages 靠這個名字當首頁 |
| `viewer.html` | 現場 PDF 檢視器（2.5 MB，內含 pdf.js 與 23 個 CJK CMap） | **不可**，兩頁互相連結 |
| `sw.js` | Service Worker，負責離線快取 | **不可**，`index.html` 內寫死路徑 |
| `manifest.webmanifest` | App 名稱、圖示、分享目標、檔案處理器 | **不可**。C2.0 起 SW 不再快取它，永遠直通網路 |
| `icon-192.png` | 主畫面圖示 | 不建議 |
| `icon-512.png` | 高解析圖示、啟動畫面 | 不建議 |
| `icon-maskable-512.png` | Android 自適應圖示（會被裁成圓形／方形） | 不建議 |

本機備份請把 `index.html` 另存一份為 `20260911_現場工具箱_C2.0.html`，維持版次可追溯。

---

## 部署步驟

1. 進入 GitHub repo `yuns7581/cy-pdf`
2. **Add file → Upload files**，把上面 7 個檔案一次拖進去
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
const CACHE = 'cy-toolbox-C2.0';   // → 改成 C2.1
```

不改這行的話，Service Worker 會繼續餵舊快取，你會以為更新沒生效。

改完上傳後，**有網路時開啟一定會拿到最新的 HTML**（C1.3 起網頁本身改成網路優先），圖示和 manifest 則會在背景更新，下次開啟生效。

### 從其他 App 送檔案進來
- **Android**：安裝後在檔案管理員長按檔案 →「分享」→ 現場工具箱。PWA 無法掛進「使用應用程式開啟」（那需要原生 App），分享選單是唯一可行的路。
- **Windows 11／桌面**：安裝後 PDF 的「開啟方式」會出現現場工具箱，第一次使用時瀏覽器會要求確認。
- 修改 manifest 後 Android 要重新產生 WebAPK：**移除主畫面圖示 → 重新安裝**，否則分享選單不會出現。

### 兩頁一個 App
`index.html` 和 `viewer.html` 同源同 scope，主畫面只會有一個圖示。
`viewer.html` **不在 install 的預抓清單裡**（2.5 MB 會拖慢安裝），改由 `index.html` 載入完 6 秒後在背景補快取。
所以第一次裝完後，讓工具箱在有網路的情況下開著十來秒，檢視器就會進快取、之後離線可用。

### 只有一種情況要手動清快取
如果那台裝置在 C1.2 或更早就開過這個網址，SW 快取裡可能卡著舊檔：
F12 → Application → Service Workers → **Unregister** → Storage → **Clear site data** → 重新整理。
C1.3 之後不會再發生這個問題。

---

## 已知限制

- **iOS Safari**：可以「加入主畫面」並離線使用，但沒有安裝提示、沒有 `beforeinstallprompt`，且 Safari 會在長期未使用後清掉快取資料。標註工具的 IndexedDB 專案資料在 iOS 上不保證長期保留，重要案件請用「匯出 JSON」另存。
- **Brave**：Shields 預設不影響同源的 Service Worker，可正常運作。
- **file:// 直接開啟**：仍然可以用（會自動略過 SW 註冊），只是沒有離線快取和安裝功能，且未來若要加 Web Bluetooth，必須走 HTTPS 這條路。
- **這個網址是公開的**。工具本身不會上傳任何檔案（全程在裝置本機處理），但網址本身任何人都能開。裡面沒有客戶資料，只有程式碼，所以沒有合規問題；但別把含診所資料的匯出檔傳到這個 repo。

---

## 資安要點

- 公開 repo 是**唯讀**給外人：知道網址的人只能看、只能 fork，**不能改、不能刪**你的內容。寫入權限只有登入你 GitHub 帳號的人，以及你手動加入的協作者。
- 唯一的實質風險是**帳號被盜**。務必開啟兩階段驗證（GitHub → Settings → Password and authentication → 建議用 Passkey 或 TOTP App）。
- 定期檢查 Settings → Collaborators（應該是空的）與 Settings → Developer settings → Personal access tokens（沒在用就全部撤銷）。
- 即使被誤刪，Git 保留完整歷史，可以從任一 commit 還原。真正不可逆的只有「刪掉整個 repo」。
- repo 內**永遠不要放**：客戶名單、勘查照片、報價、API 金鑰、任何個資。這個 repo 只放程式碼。
- C1.4 起 `index.html` 帶有 `noindex,nofollow,noarchive`，搜尋引擎不會收錄這個網址，也不會留快照。網址本身仍然是公開的，知道的人照樣打得開——這是「不被搜到」，不是「加密保護」。
