export function getDashboardHtml(baseRoute: string, localesDirName: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Link Dev Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --background: #ffffff;
      --foreground: #090d16;
      --card: #ffffff;
      --card-foreground: #090d16;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --primary: #2563eb;
      --primary-foreground: #ffffff;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans Myanmar', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    html.dark {
      --background: #090d16;
      --foreground: #f8fafc;
      --card: #0f172a;
      --card-foreground: #f8fafc;
      --border: #1e293b;
      --input: #1e293b;
      --primary: #3b82f6;
      --primary-foreground: #090d16;
      --muted: #1e293b;
      --muted-foreground: #94a3b8;
      --success: #34d399;
      --warning: #fbbf24;
      --danger: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--background);
      color: var(--foreground);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--border);
      background-color: var(--card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    button, .btn {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    button:hover { background: var(--muted); }
    button.primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }
    button.primary:hover { opacity: 0.92; }
    button.primary.dirty {
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    .toolbar {
      padding: 10px 20px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .search-box {
      position: relative;
      flex: 1;
      max-width: 360px;
    }
    .search-box input {
      width: 100%;
      padding: 7px 12px 7px 32px;
      background: var(--background);
      border: 1px solid var(--input);
      border-radius: 6px;
      color: var(--foreground);
      font-size: 12px;
      outline: none;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted-foreground);
    }
    .table-container {
      flex: 1;
      overflow: auto;
      background: var(--background);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: var(--card);
      color: var(--muted-foreground);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      vertical-align: top;
    }
    td.key-cell {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
      color: var(--foreground);
      width: 240px;
      max-width: 300px;
      background: var(--card);
    }
    .cell-input {
      width: 100%;
      border: 1px solid transparent;
      background: transparent;
      color: var(--foreground);
      font-family: inherit;
      font-size: 13px;
      padding: 6px 8px;
      border-radius: 4px;
      outline: none;
      resize: vertical;
      min-height: 32px;
    }
    .cell-input:focus {
      background: var(--card);
      border-color: var(--primary);
    }
    .del-btn {
      color: var(--muted-foreground);
      border: none;
      background: transparent;
      padding: 4px 6px;
      cursor: pointer;
    }
    .del-btn:hover { color: var(--danger); }
    footer {
      padding: 8px 20px;
      border-top: 1px solid var(--border);
      background: var(--card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted-foreground);
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary)">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
      <strong style="font-size: 14px;">JSON Link Dev Dashboard</strong>
      <span class="badge">VITE HMR</span>
      <span class="badge" style="background: var(--muted); color: var(--muted-foreground); border-color: var(--border);">
        ${localesDirName}
      </span>
    </div>
    <div class="actions">
      <button id="addKeyBtn">+ Add Key</button>
      <button id="addLangBtn">+ Add Language</button>
      <button id="themeToggle" title="Toggle Dark/Light">🌙</button>
      <button id="saveBtn" class="primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Save to Disk
      </button>
    </div>
  </header>

  <div class="toolbar">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" placeholder="Filter keys or content...">
    </div>
    <div id="statsSummary" style="font-size: 12px; color: var(--muted-foreground);">
      Loading translations...
    </div>
  </div>

  <div class="table-container">
    <table id="dataTable">
      <thead id="tableHead"></thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <footer>
    <div id="statusMsg">Ready. All changes write directly to disk with instant Vite HMR.</div>
    <div>Shortcut: <kbd>Ctrl</kbd>+<kbd>S</kbd> / <kbd>Cmd</kbd>+<kbd>S</kbd> to save</div>
  </footer>

  <script>
    const API_BASE = '${baseRoute}/api/locales';
    let languages = [];
    let records = [];
    let isDirty = false;

    async function loadData() {
      try {
        const res = await fetch(API_BASE);
        const data = await res.json();
        if (data.success) {
          languages = data.languages || [];
          records = data.records || [];
          renderTable();
          updateStats();
        }
      } catch (err) {
        document.getElementById('statusMsg').innerText = 'Error loading data: ' + err.message;
      }
    }

    function renderTable() {
      const query = document.getElementById('searchInput').value.toLowerCase();
      const head = document.getElementById('tableHead');
      const body = document.getElementById('tableBody');

      // Build Head
      let headHtml = '<tr><th style="width: 260px;">Key</th>';
      for (const lang of languages) {
        headHtml += \`<th>\${lang.toUpperCase()}</th>\`;
      }
      headHtml += '<th style="width: 40px;"></th></tr>';
      head.innerHTML = headHtml;

      // Filter
      const filtered = records.filter(r => {
        if (!query) return true;
        if (r.key.toLowerCase().includes(query)) return true;
        return languages.some(l => (r[l] || '').toLowerCase().includes(query));
      });

      // Build Body
      let bodyHtml = '';
      filtered.forEach((r, idx) => {
        bodyHtml += \`<tr>
          <td class="key-cell">
            <input class="cell-input" style="font-family: var(--font-mono); font-weight: 600;" value="\${escapeHtml(r.key)}" onchange="updateKey(\${idx}, this.value)" />
          </td>\`;
        for (const lang of languages) {
          bodyHtml += \`<td>
            <textarea class="cell-input" oninput="updateVal(\${idx}, '\${lang}', this.value)">\${escapeHtml(r[lang] || '')}</textarea>
          </td>\`;
        }
        bodyHtml += \`<td>
          <button class="del-btn" onclick="deleteRow(\${idx})" title="Delete key">✕</button>
        </td></tr>\`;
      });

      body.innerHTML = bodyHtml;
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.updateKey = (idx, newKey) => {
      records[idx].key = newKey.trim();
      markDirty();
    };

    window.updateVal = (idx, lang, val) => {
      records[idx][lang] = val;
      markDirty();
    };

    window.deleteRow = (idx) => {
      records.splice(idx, 1);
      markDirty();
      renderTable();
      updateStats();
    };

    function markDirty() {
      isDirty = true;
      const btn = document.getElementById('saveBtn');
      btn.classList.add('dirty');
      btn.innerText = '● Save to Disk';
      document.getElementById('statusMsg').innerText = 'Unsaved changes on disk.';
    }

    async function saveToDisk() {
      const btn = document.getElementById('saveBtn');
      btn.innerText = 'Saving...';
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records, languages })
        });
        const result = await res.json();
        if (result.success) {
          isDirty = false;
          btn.classList.remove('dirty');
          btn.innerText = '✓ Saved to Disk';
          setTimeout(() => { btn.innerText = 'Save to Disk'; }, 2000);
          document.getElementById('statusMsg').innerText = 'Saved ' + records.length + ' keys to disk at ' + new Date().toLocaleTimeString();
        } else {
          alert('Save failed: ' + result.error);
        }
      } catch (err) {
        alert('Save error: ' + err.message);
      }
    }

    document.getElementById('saveBtn').onclick = saveToDisk;

    document.getElementById('addKeyBtn').onclick = () => {
      const keyName = prompt('Enter new translation key (e.g. auth.signin):');
      if (keyName && keyName.trim()) {
        records.unshift({ key: keyName.trim() });
        markDirty();
        renderTable();
        updateStats();
      }
    };

    document.getElementById('addLangBtn').onclick = () => {
      const langCode = prompt('Enter new language code (e.g. ja, zh, es):');
      if (langCode && langCode.trim()) {
        const code = langCode.trim().toLowerCase();
        if (!languages.includes(code)) {
          languages.push(code);
          markDirty();
          renderTable();
          updateStats();
        }
      }
    };

    document.getElementById('searchInput').oninput = renderTable;

    document.getElementById('themeToggle').onclick = () => {
      document.documentElement.classList.toggle('dark');
    };

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToDisk();
      }
    });

    function updateStats() {
      document.getElementById('statsSummary').innerText = \`\${records.length} keys across \${languages.length} languages (\${languages.map(l => l.toUpperCase()).join(', ')})\`;
    }

    loadData();
  </script>
</body>
</html>`;
}
