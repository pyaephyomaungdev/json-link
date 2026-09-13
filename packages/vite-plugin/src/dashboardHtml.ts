export function getDashboardHtml(baseRoute: string, localesDirName: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Link — Dev Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --background: #f8fafc;
      --foreground: #0f172a;
      --card: #ffffff;
      --card-foreground: #0f172a;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --primary: #2563eb;
      --primary-foreground: #ffffff;
      --primary-hover: #1d4ed8;
      --muted: #f1f5f9;
      --muted-foreground: #64748b;
      --hover-row: #f8fafc;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Noto Sans Myanmar", sans-serif;
      --font-mono: "JetBrains Mono", monospace;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    }
    html.dark {
      --background: #090d16;
      --foreground: #f8fafc;
      --card: #0d1424;
      --card-foreground: #f8fafc;
      --border: #1e293b;
      --input: #1e293b;
      --primary: #3b82f6;
      --primary-foreground: #ffffff;
      --primary-hover: #2563eb;
      --muted: #162032;
      --muted-foreground: #94a3b8;
      --hover-row: #111a2e;
      --success: #34d399;
      --warning: #fbbf24;
      --danger: #f87171;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
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
      overflow-x: hidden;
    }

    /* Header Nav */
    header {
      padding: 10px 20px;
      border-bottom: 1px solid var(--border);
      background-color: var(--card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: var(--shadow-sm);
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981 0%, #0d9488 50%, #4f46e5 100%);
      padding: 1.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
      flex-shrink: 0;
    }
    .brand-logo-inner {
      width: 100%;
      height: 100%;
      background: #090d16;
      border-radius: 8.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand-title .text-brand-grad {
      background: linear-gradient(to right, #10b981, #14b8a6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
      font-family: var(--font-mono);
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 5px;
      line-height: 1.2;
    }
    .pill-emerald {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.28);
    }
    .pill-blue {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.28);
    }
    .pill-muted {
      background: var(--muted);
      color: var(--muted-foreground);
      border: 1px solid var(--border);
    }

    /* Buttons */
    .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      user-select: none;
      box-shadow: var(--shadow-sm);
    }
    .btn:hover {
      background: var(--muted);
      border-color: var(--border);
    }
    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
    .btn-primary.dirty {
      background: #f59e0b;
      border-color: #f59e0b;
      color: #ffffff;
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
      animation: pulse 2s infinite;
    }
    .btn-primary.saved {
      background: #10b981;
      border-color: #10b981;
      color: #ffffff;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
    .btn-icon {
      padding: 6px 9px;
    }

    /* Sub Toolbar */
    .sub-toolbar {
      padding: 8px 20px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      max-width: 600px;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 200px;
    }
    .search-box input {
      width: 100%;
      padding: 6px 36px 6px 30px;
      background: var(--background);
      border: 1px solid var(--input);
      border-radius: 6px;
      color: var(--foreground);
      font-size: 12px;
      outline: none;
      transition: all 0.15s ease;
    }
    .search-box input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .search-icon {
      position: absolute;
      left: 9px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted-foreground);
      pointer-events: none;
      display: flex;
      align-items: center;
    }
    .search-kbd {
      position: absolute;
      right: 7px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--muted-foreground);
      background: var(--muted);
      border: 1px solid var(--border);
      padding: 1px 5px;
      border-radius: 4px;
      pointer-events: none;
    }
    .tabs-group {
      display: inline-flex;
      background: var(--background);
      padding: 2.5px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    .tab-btn {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 600;
      border: none;
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .tab-btn.active {
      background: var(--card);
      color: var(--foreground);
      box-shadow: var(--shadow-sm);
    }
    .tab-count {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--muted);
    }
    .tab-btn.active .tab-count {
      background: rgba(59, 130, 246, 0.15);
      color: var(--primary);
    }
    .stats-info {
      font-size: 11.5px;
      color: var(--muted-foreground);
      font-family: var(--font-mono);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Spreadsheet Grid Container */
    .table-container {
      flex: 1;
      overflow: auto;
      background: var(--background);
      position: relative;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      text-align: left;
    }
    thead {
      position: sticky;
      top: 0;
      z-index: 20;
      background: var(--card);
      box-shadow: var(--shadow-sm);
    }
    th {
      background: var(--card);
      color: var(--foreground);
      font-weight: 600;
      font-size: 11px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      user-select: none;
    }
    .th-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .col-header-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .col-letter {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      background: rgba(59, 130, 246, 0.1);
      color: var(--primary);
      padding: 1px 5px;
      border-radius: 3px;
    }
    .lang-badge {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .th-btn {
      border: none;
      background: transparent;
      padding: 2px 4px;
      border-radius: 4px;
      color: var(--muted-foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }
    .th-btn:hover {
      color: var(--danger);
      background: rgba(239, 68, 68, 0.1);
    }

    /* Table Rows & Cells */
    tr {
      background: var(--card);
      transition: background 0.1s ease;
    }
    tr:hover {
      background: var(--hover-row);
    }
    td {
      padding: 4px 6px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      vertical-align: top;
    }
    td.row-index-cell {
      width: 50px;
      min-width: 50px;
      max-width: 50px;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--muted-foreground);
      background: var(--card);
      user-select: none;
      padding: 8px 4px;
    }
    td.key-cell {
      width: 260px;
      min-width: 220px;
      max-width: 320px;
      background: var(--card);
    }
    .key-input {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      color: var(--foreground);
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      padding: 6px 8px;
      outline: none;
      transition: all 0.15s ease;
    }
    .key-input:focus {
      background: var(--background);
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }
    .val-cell {
      min-width: 240px;
      position: relative;
    }
    .val-textarea {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      color: var(--foreground);
      font-family: var(--font-sans);
      font-size: 12.5px;
      line-height: 1.45;
      padding: 6px 8px;
      outline: none;
      resize: none;
      min-height: 32px;
      display: block;
      transition: all 0.15s ease;
    }
    .val-textarea:focus {
      background: var(--background);
      border-color: var(--primary);
      box-shadow: 0 0 0 1px var(--primary);
    }
    .actions-cell {
      width: 70px;
      min-width: 70px;
      text-align: center;
      padding: 6px 4px;
    }
    .row-actions-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      opacity: 0.4;
      transition: opacity 0.15s ease;
    }
    tr:hover .row-actions-wrap {
      opacity: 1;
    }
    .action-icon-btn {
      border: none;
      background: transparent;
      padding: 4px;
      border-radius: 4px;
      color: var(--muted-foreground);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
    }
    .action-icon-btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .action-icon-btn.delete:hover {
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
    }

    /* Footer Status Bar */
    footer {
      padding: 6px 20px;
      border-top: 1px solid var(--border);
      background: var(--card);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-size: 11px;
      color: var(--muted-foreground);
      font-family: var(--font-mono);
      box-shadow: 0 -1px 2px 0 rgba(0, 0, 0, 0.03);
    }
    .status-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }
    .status-dot.dirty {
      background: #f59e0b;
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
    }
    .shortcuts-hint {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    kbd {
      font-family: var(--font-mono);
      font-size: 9.5px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 1px 4px;
      color: var(--foreground);
    }

    /* Modal Dialogs */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
    }
    .modal-backdrop.open {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      transform: scale(0.96);
      transition: transform 0.15s ease;
    }
    .modal-backdrop.open .modal-card {
      transform: scale(1);
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal-input {
      width: 100%;
      padding: 8px 12px;
      background: var(--background);
      border: 1px solid var(--input);
      border-radius: 6px;
      color: var(--foreground);
      font-size: 13px;
      outline: none;
    }
    .modal-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .modal-footer {
      padding: 12px 20px;
      border-top: 1px solid var(--border);
      background: var(--muted);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }
    .pill-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .sug-pill {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--background);
      border: 1px solid var(--border);
      cursor: pointer;
      color: var(--muted-foreground);
    }
    .sug-pill:hover {
      color: var(--primary);
      border-color: var(--primary);
    }
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: var(--muted-foreground);
    }
  </style>
</head>
<body>

  <!-- Top Navigation Header -->
  <header>
    <div class="brand-wrap">
      <!-- Official JSON Link Brand Icon Badge -->
      <div class="brand-logo-badge">
        <div class="brand-logo-inner">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 22px; height: 22px;">
            <path d="M11 7C9.34315 7 8 8.34315 8 10V13C8 14.6569 6.65685 16 5 16C6.65685 16 8 17.3431 8 19V22C8 23.6569 9.34315 25 11 25" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 7C22.6569 7 24 8.34315 24 10V13C24 14.6569 25.3431 16 27 16C25.3431 16 24 17.3431 24 19V22C24 23.6569 22.6569 25 21 25" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 16H20" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 2.5"/>
            <circle cx="12" cy="16" r="2" fill="#34d399"/>
            <circle cx="20" cy="16" r="2" fill="#38bdf8"/>
          </svg>
        </div>
      </div>
      
      <div class="brand-title">
        <span>JSON</span>
        <span class="text-brand-grad">Link</span>
      </div>

      <span class="pill-badge pill-emerald">Dev Dashboard</span>
      <span class="pill-badge pill-blue">Vite HMR</span>
      <span class="pill-badge pill-muted" title="Target Directory">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        ${localesDirName}
      </span>
    </div>

    <!-- Actions -->
    <div class="btn-group">
      <button class="btn" id="openAddKeyBtn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Key</span>
      </button>

      <button class="btn" id="openAddLangBtn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <span>Add Language</span>
      </button>

      <button class="btn btn-icon" id="themeToggle" title="Toggle Theme (Dark / Light)">
        <svg id="themeIconDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <svg id="themeIconLight" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>

      <button class="btn btn-primary" id="saveBtn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span id="saveBtnText">Save to Disk</span>
      </button>
    </div>
  </header>

  <!-- Sub Toolbar & Filters -->
  <div class="sub-toolbar">
    <div class="filter-wrap">
      <div class="search-box">
        <span class="search-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input type="text" id="searchInput" placeholder="Search keys or translations...">
        <span class="search-kbd">⌘K</span>
      </div>

      <div class="tabs-group">
        <button class="tab-btn active" id="tabAll" onclick="setFilter('all')">
          <span>All</span>
          <span class="tab-count" id="countAll">0</span>
        </button>
        <button class="tab-btn" id="tabMissing" onclick="setFilter('missing')">
          <span>Missing</span>
          <span class="tab-count" id="countMissing">0</span>
        </button>
      </div>
    </div>

    <div class="stats-info" id="statsInfo">
      Loading translations...
    </div>
  </div>

  <!-- Spreadsheet Grid -->
  <div class="table-container">
    <table id="dataTable">
      <thead id="tableHead"></thead>
      <tbody id="tableBody"></tbody>
    </table>
    <div id="emptyView" class="empty-state" style="display: none;">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin: 0 auto 12px; color: var(--muted-foreground);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <p style="font-weight: 600; margin-bottom: 4px;">No translation keys match your search</p>
      <p style="font-size: 12px;">Try clearing your query or add a new translation key</p>
    </div>
  </div>

  <!-- Footer / Status Bar -->
  <footer>
    <div class="status-left">
      <span class="status-dot" id="statusDot"></span>
      <span id="statusMsg">Connected to Vite dev server (HMR Active)</span>
    </div>
    <div class="shortcuts-hint">
      <span><kbd>⌘S</kbd> Save</span>
      <span><kbd>⌘K</kbd> Search</span>
      <span><kbd>Esc</kbd> Close</span>
    </div>
  </footer>

  <!-- Modal: Add Key -->
  <div class="modal-backdrop" id="addKeyModal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><path d="M21 2l-2 2m-1-1l-3 3m-2-2l-2 2m-1-1l-3 3m-2-2l-2 2M3 21l6-6m0 0a5 5 0 1 0 7-7 5 5 0 0 0-7 7z"></path></svg>
          <span>Add Translation Key</span>
        </div>
        <button class="action-icon-btn" onclick="closeModal('addKeyModal')">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 12px; color: var(--muted-foreground);">
          Enter a dot-notated key name to organize your keys by component or feature:
        </p>
        <input type="text" id="newKeyInput" class="modal-input" placeholder="e.g. auth.signin.button or app.title" autofocus>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('addKeyModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddKey()">Add Key</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add Language -->
  <div class="modal-backdrop" id="addLangModal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          <span>Add Language</span>
        </div>
        <button class="action-icon-btn" onclick="closeModal('addLangModal')">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size: 12px; color: var(--muted-foreground);">
          Enter a standard BCP 47 language code:
        </p>
        <input type="text" id="newLangInput" class="modal-input" placeholder="e.g. ja, es, fr, de, ko, zh">
        <div class="pill-suggestions">
          <span class="sug-pill" onclick="pickLang('ja')">🇯🇵 ja (Japanese)</span>
          <span class="sug-pill" onclick="pickLang('es')">🇪🇸 es (Spanish)</span>
          <span class="sug-pill" onclick="pickLang('fr')">🇫🇷 fr (French)</span>
          <span class="sug-pill" onclick="pickLang('de')">🇩🇪 de (German)</span>
          <span class="sug-pill" onclick="pickLang('zh')">🇨🇳 zh (Chinese)</span>
          <span class="sug-pill" onclick="pickLang('th')">🇹🇭 th (Thai)</span>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('addLangModal')">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddLang()">Add Language</button>
      </div>
    </div>
  </div>

  <!-- Script Logic -->
  <script>
    const API_BASE = "${baseRoute}/api/locales";
    let languages = [];
    let records = [];
    let isDirty = false;
    let currentFilter = "all";

    function getColLetter(colIdx) {
      let letter = "";
      while (colIdx >= 0) {
        letter = String.fromCharCode((colIdx % 26) + 65) + letter;
        colIdx = Math.floor(colIdx / 26) - 1;
      }
      return letter;
    }

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
        document.getElementById("statusMsg").innerText = "Error loading locales: " + err.message;
      }
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.getElementById("tabAll").classList.toggle("active", filter === "all");
      document.getElementById("tabMissing").classList.toggle("active", filter === "missing");
      renderTable();
    }

    function renderTable() {
      const query = document.getElementById("searchInput").value.toLowerCase().trim();
      const head = document.getElementById("tableHead");
      const body = document.getElementById("tableBody");
      const emptyView = document.getElementById("emptyView");

      // Build Head
      let headHtml = "<tr><th style="width: 50px; text-align: center;">#</th>";
      headHtml += "<th style="width: 260px;"><div class="th-content"><div class="col-header-left"><span class="col-letter">A</span><span style="font-weight: 700;">Translation Key</span></div></div></th>";
      
      languages.forEach(function(lang, idx) {
        const colLetter = getColLetter(idx + 1);
        headHtml += "<th><div class="th-content"><div class="col-header-left"><span class="col-letter">" + colLetter + "</span><span class="lang-badge">" + escapeHtml(lang.toUpperCase()) + "</span></div>" +
          (languages.length > 1 ? "<button class="th-btn" onclick="deleteLanguage('" + escapeHtml(lang) + "')" title="Delete " + lang.toUpperCase() + " locale"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>" : "") +
          "</div></th>";
      });

      headHtml += "<th style="width: 70px; text-align: center;">Actions</th></tr>";
      head.innerHTML = headHtml;

      // Filter rows
      const filtered = records.filter(function(r) {
        if (currentFilter === "missing") {
          const hasMissing = languages.some(function(l) { return !r[l] || r[l].trim() === ""; });
          if (!hasMissing) return false;
        }
        if (!query) return true;
        if (r.key.toLowerCase().includes(query)) return true;
        return languages.some(function(l) { return (r[l] || "").toLowerCase().includes(query); });
      });

      if (filtered.length === 0) {
        body.innerHTML = "";
        emptyView.style.display = "block";
        return;
      }

      emptyView.style.display = "none";

      // Build Body
      let bodyHtml = "";
      filtered.forEach(function(r, idx) {
        const originalIndex = records.indexOf(r);
        bodyHtml += "<tr><td class="row-index-cell">" + (idx + 1) + "</td>" +
          "<td class="key-cell"><input class="key-input" value="" + escapeHtml(r.key) + "" onchange="updateKey(" + originalIndex + ", this.value)" placeholder="key.name" spellcheck="false" /></td>";
        
        languages.forEach(function(lang) {
          bodyHtml += "<td class="val-cell"><textarea class="val-textarea" oninput="autoGrow(this); updateVal(" + originalIndex + ", '" + escapeHtml(lang) + "', this.value)" placeholder="Empty translation..." rows="1">" + escapeHtml(r[lang] || "") + "</textarea></td>";
        });

        bodyHtml += "<td class="actions-cell"><div class="row-actions-wrap">" +
          "<button class="action-icon-btn" onclick="copyKey('" + escapeHtml(r.key) + "', this)" title="Copy Key"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>" +
          "<button class="action-icon-btn delete" onclick="deleteRow(" + originalIndex + ")" title="Delete Key"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>" +
          "</div></td></tr>";
      });

      body.innerHTML = bodyHtml;

      // Auto-grow textareas
      document.querySelectorAll(".val-textarea").forEach(function(el) { autoGrow(el); });
    }

    function autoGrow(element) {
      element.style.height = "auto";
      element.style.height = Math.max(32, element.scrollHeight) + "px";
    }

    function escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    window.updateKey = function(idx, newKey) {
      const clean = newKey.trim();
      if (!clean) return;
      records[idx].key = clean;
      markDirty();
      updateStats();
    };

    window.updateVal = function(idx, lang, val) {
      records[idx][lang] = val;
      markDirty();
      updateStats();
    };

    window.deleteRow = function(idx) {
      const keyName = records[idx] ? records[idx].key : "";
      if (confirm("Delete translation key \\"" + keyName + "\\"?")) {
        records.splice(idx, 1);
        markDirty();
        renderTable();
        updateStats();
      }
    };

    window.deleteLanguage = function(lang) {
      if (confirm("Delete language \\"" + lang.toUpperCase() + "\\" and its file?")) {
        languages = languages.filter(function(l) { return l !== lang; });
        records.forEach(function(r) { delete r[lang]; });
        markDirty();
        renderTable();
        updateStats();
      }
    };

    window.copyKey = function(key, btn) {
      if (navigator.clipboard) navigator.clipboard.writeText(key);
      const original = btn.innerHTML;
      btn.innerHTML = "<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>";
      setTimeout(function() { btn.innerHTML = original; }, 1500);
    };

    function markDirty() {
      isDirty = true;
      const btn = document.getElementById("saveBtn");
      btn.classList.add("dirty");
      btn.classList.remove("saved");
      document.getElementById("saveBtnText").innerText = "● Save Changes";
      document.getElementById("statusDot").classList.add("dirty");
      document.getElementById("statusMsg").innerText = "Unsaved changes (writing to disk on save)";
    }

    async function saveToDisk() {
      const btn = document.getElementById("saveBtn");
      const text = document.getElementById("saveBtnText");
      text.innerText = "Saving...";
      try {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: records, languages: languages })
        });
        const result = await res.json();
        if (result.success) {
          isDirty = false;
          btn.classList.remove("dirty");
          btn.classList.add("saved");
          text.innerText = "✓ Saved to Disk";
          document.getElementById("statusDot").classList.remove("dirty");
          document.getElementById("statusMsg").innerText = "✓ Saved " + records.length + " keys to disk at " + new Date().toLocaleTimeString();
          setTimeout(function() {
            btn.classList.remove("saved");
            text.innerText = "Save to Disk";
          }, 2000);
        } else {
          alert("Save failed: " + result.error);
          text.innerText = "Save to Disk";
        }
      } catch (err) {
        alert("Save error: " + err.message);
        text.innerText = "Save to Disk";
      }
    }

    document.getElementById("saveBtn").onclick = saveToDisk;

    // Modal controls
    function openModal(id) {
      document.getElementById(id).classList.add("open");
      const input = document.getElementById(id).querySelector("input");
      if (input) {
        input.value = "";
        setTimeout(function() { input.focus(); }, 50);
      }
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove("open");
    }

    window.closeModal = closeModal;

    document.getElementById("openAddKeyBtn").onclick = function() { openModal("addKeyModal"); };
    document.getElementById("openAddLangBtn").onclick = function() { openModal("addLangModal"); };

    function submitAddKey() {
      const input = document.getElementById("newKeyInput");
      const keyName = input.value.trim();
      if (keyName) {
        records.unshift({ key: keyName });
        markDirty();
        renderTable();
        updateStats();
        closeModal("addKeyModal");
      }
    }
    window.submitAddKey = submitAddKey;

    function submitAddLang() {
      const input = document.getElementById("newLangInput");
      const code = input.value.trim().toLowerCase();
      if (code && !languages.includes(code)) {
        languages.push(code);
        markDirty();
        renderTable();
        updateStats();
        closeModal("addLangModal");
      }
    }
    window.submitAddLang = submitAddLang;

    window.pickLang = function(code) {
      document.getElementById("newLangInput").value = code;
      submitAddLang();
    };

    // Keyboard bindings
    window.addEventListener("keydown", function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveToDisk();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("searchInput").focus();
      }
      if (e.key === "Escape") {
        closeModal("addKeyModal");
        closeModal("addLangModal");
      }
      if (e.key === "Enter") {
        if (document.getElementById("addKeyModal").classList.contains("open")) {
          submitAddKey();
        } else if (document.getElementById("addLangModal").classList.contains("open")) {
          submitAddLang();
        }
      }
    });

    document.getElementById("searchInput").oninput = renderTable;

    // Theme toggle
    const themeBtn = document.getElementById("themeToggle");
    const darkIcon = document.getElementById("themeIconDark");
    const lightIcon = document.getElementById("themeIconLight");

    themeBtn.onclick = function() {
      const isDark = document.documentElement.classList.toggle("dark");
      darkIcon.style.display = isDark ? "inline" : "none";
      lightIcon.style.display = isDark ? "none" : "inline";
    };

    function updateStats() {
      const missingCount = records.filter(function(r) {
        return languages.some(function(l) { return !r[l] || r[l].trim() === ""; });
      }).length;
      document.getElementById("countAll").innerText = records.length;
      document.getElementById("countMissing").innerText = missingCount;

      document.getElementById("statsInfo").innerText = 
        records.length + " keys across " + languages.length + " languages (" + languages.map(function(l) { return l.toUpperCase(); }).join(", ") + ")";
    }

    loadData();
  </script>
</body>
</html>`;
}
