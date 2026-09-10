# JSON Link — Project Overview & Documentation (Myanmar / မြန်မာဘာသာ)

> JSON Link ၏ အဓိက Features များ၊ Architecture နှင့် Developer Workflow အကုန်လုံးကို ဖော်ပြထားသော Documentation ဖြစ်ပါသည်။
> Live Demo: https://json-link.pages.dev · GitHub: https://github.com/pyaephyomaungdev/json-link

---

## 🚀 Developer များအတွက် Free & Open-Source Localization Workspace — "JSON Link"

React, Next.js, Flutter, Android, iOS app များတွင် ဘာသာစကားအများအပြား (i18n / Localization) ထည့်သွင်းရာတွင် developer တိုင်း ကြုံဖူးသည့် ပြဿနာများ—

* 🤯 `en.json`, `my.json`, `th.json` ဖိုင်ပေါင်းများစွာကြား လိုက်ရှာနေရခြင်း။
* 📋 Translator ဆီမှ Excel ဖိုင်ကြီးရောက်လာပြီး JSON ပြန်ပြောင်းရတာ ချိန်ကုန်နေခြင်း။
* 💥 `{username}`, `%s`, `{{count}}` variable များ ကျန်ကွာကာ app crash ဖြစ်ခြင်း။
* 🤖 AI ကို ဘာသာပြန်ခိုင်းရာ Brand name (KBZPay, JSON Link) ပါ မျက်မသိနာ ပြောင်းသွားခြင်း။
* **မြန်မာ developer များဆိုရင် — Zawgyi font ရောနှောပြီး app ထဲ စာလုံးများ ပျက်သွားခြင်း (ျမန္မာ)!**

**JSON Link** သည် ဒီပြဿနာများ အားလုံးကို ဖြေရှင်းနိုင်သော **100% Client-Side, Open-Source Localization Spreadsheet & AI Translation Workspace** တစ်ခုဖြစ်ပါသည်။ Backend မရှိ၊ Subscription မလိုအပ်၊ Data ပြင်ပ server ထံ မသွားပါ။

---

## 🌟 JSON Link ၏ အဓိက Features များ

### 1. 📊 Authentic Excel-Style Spreadsheet Interface
* **Edge-to-Edge Grid**: Row numbers, Column letters (A, B, C…), gridlines — Excel စစ်စစ်ကဲ့သို့ Full-viewport spreadsheet။
* **Formula Bar (fx)**: Active cell address (ဥပမာ `B14 [en]`) ကို ကျယ်ပြန့်သော Text inspector ဖြင့် ကြည့်ရှု/ပြင်ဆင်နိုင်ခြင်း။
* **Freeze Panes**: Column headers sticky, Key column နှင့် Language column များ ဘယ်ဘက်တွင် freeze — 1 click ဖြင့် on/off လုပ်နိုင်ခြင်း။
* **Excel-Like Drag Column Resize**: Header divider ကို ဖိဆွဲ၍ column width ချိန်ညှိနိုင်ပြီး `localStorage` တွင် သိမ်းဆည်းနိုင်ခြင်း။ "Reset Widths" 1-click restore ပါဝင်ခြင်း။
* **Keyboard Navigation**: `Arrow` key grid navigation, `Tab`/`Shift+Tab` cell advancement, `Enter` ဖြင့် edit ပြီး next row ဆင်းသွားနိုင်ခြင်း။
* **Translation Diff & Revert**: AI မှ ဘာသာပြန်ထားသော cell တိုင်းတွင် `[↺ Revert]` chip ပေါ်ပြီး 1-click ဖြင့် မူလ value ပြန်ရနိုင်ခြင်း။
* **Missing Key Badges**: Column header တွင် လွတ်နေသော key အရေအတွက်ကို amber badge ဖြင့် ပြ၊ badge နှိပ်ရုံဖြင့် missing rows ချက်ချင်း filter ကျနိုင်ခြင်း။
* **Horizontal Scroll Indicators**: Scrollbar မပြဘဲ content ကျော်နေပါက ← → arrow ခလုတ်သေးသေးများ အလိုအလျောက် ပေါ်လာပြီး ညာ/ဘယ် scroll လုပ်ပေးနိုင်ခြင်း — Toolbar, Tabs, Status Bar တိုင်းတွင် project-wide အသုံးပြုနိုင်ခြင်း။

---

### 2. 🔤 Myanmar Unicode ⇄ Zawgyi Auto-Detector & Converter
* **မြန်မာ/SEA Developer များအတွက် အထူးပြုဆောင်ရွက်ထားသော Feature!**
* Column ထဲတွင် Zawgyi encoding ရောနှောပါလာပါက Header ပေါ်တွင် **⚠ Excel-style warning badge** ဖြင့် အလိုအလျောက် သတိပေးခြင်း။
* **1-Click Bidirectional Conversion**:
  * Zawgyi → Unicode: Rabbit algorithm ဖြင့် အမှန်ကန်ဆုံး syllable reordering ဖြင့် ပြောင်းပေးနိုင်ခြင်း။
  * Unicode → Zawgyi: Legacy device support အတွက် ပြောင်းပြန်လည်ပြောင်းနိုင်ခြင်း။

---

### 3. 🤖 Multi-Language AI Auto-Translation (OpenRouter BYOK)
* **Batch Translate**: Language အားလုံးကို တပြိုင်နက် ဘာသာပြန်ပြီး `Translating Thai (TH) (3/10 keys)... [Overall: 35%]` ဆိုသည့် live progress ဖြင့် ကြည့်ရှုနိုင်ခြင်း။
* **Translation Scope Toggle**: **Missing Keys Only** (empty cell သာဖြည့်) / **All Rows (Overwrite)** — count badge ဖြင့် ကြည့်ပြီး ရွေးချယ်နိုင်ခြင်း။
* **Variable Safety**: `{username}`, `{{count}}`, `%s` — AI မှ မဖျက်ဆီးနိုင်ဘဲ အလိုအလျောက် ထိန်းသိမ်းပေးခြင်း။
* **AI Translation Glossary & Termbase**: "KBZPay" ကို ဘာမျှမပြောင်း / "ငွေပေး" ဟု ပြောင်းရန် — Rule များ သတ်မှတ်၍ AI prompt ထဲသို့ အလိုအလျောက် ထည့်သွင်းပေးခြင်း။
* **OpenRouter Model ၂၀ ကျော်**: Gemini 2.5 Flash, DeepSeek V3, GPT-4o Mini, Claude 3.5 Haiku — သို့မဟုတ် custom model ID မည်သည်ကိုမဆို အသုံးပြုနိုင်ခြင်း။
* **Auto Review Tagging**: AI ဘာသာပြန်ထားသော row တိုင်းကို `Needs Review` status ဖြင့် အလိုအလျောက် tag တပ်ထားပေးခြင်း။

---

### 4. 🔎 Localization QA & Consistency Linter
* **Real-Time Automated Quality Scan** — Language အားလုံးတွင် localization ပြဿနာများကို စကင်ပေးနိုင်ခြင်း:
  * **Whitespace**: Key/Value ၏ ရှေ့/နောက် space မလိုအပ်ဘဲ ပါလာခြင်း။
  * **Variable Mismatches**: Target translation တွင် source variable (`{name}`, `%s`) မပါဝင်ခြင်း။
  * **Length Expansion**: Source ၏ 2.5 ဆ ကျော်ပြီး mobile button တွင် text clip ဖြစ်နိုင်ခြင်း။
  * **Duplicates**: Key မတူဘဲ translation တူနေခြင်း (Duplicate translation)။
  * **Untranslated**: Target ​value သည် English source နှင့် အတူတူပင်ဖြစ်နေခြင်း။
  * **Missing**: Translation လုံးဝ ဖြည့်မထားသေးသော key များ။
* **Auto-Fix**: "Fix All Whitespace" ခလုတ် 1-click ဖြင့် whitespace ပြဿနာ အားလုံး ချက်ချင်းဖြေရှင်းနိုင်ခြင်း။
* **Jump to Cell**: Issue တစ်ခုစီ၏ "Jump" ခလုတ်ဖြင့် spreadsheet ထဲ exact cell ကို တိုက်ရိုက် focus ချနိုင်ခြင်း။
* **Scorecard-Style Underline Tabs**: Category per live count (`All Issues (12)`, `Whitespace (3)`…) ဖြင့် filter ကြည့်နိုင်ခြင်း။

---

### 5. 🏥 Localization Health & Scorecard
* **Dashboard**: Language တစ်ခုချင်းစီ ပြီးစီးမှု ရာခိုင်နှုန်း (%), missing count, variable warning count ကို real-time ဖော်ပြပေးခြင်း။
* **Quick Batch Translate**: Language row တစ်ခုစီတွင် "Translate Missing" ခလုတ် 1-click ဖြင့် AI ကို empty keys သာ ဘာသာပြန်ခိုင်းနိုင်ခြင်း။
* **Variable Integrity Audit**: Source variable မပါသော translation key အားလုံးကို list ပေးနိုင်ခြင်း။

---

### 6. ✅ Row Review Workflow Statuses
* **Editorial workflow အဆင့်သုံးဆင့်**:
  * 🩶 **Draft** — အသစ်/ဆက်လက်ပြင်ဆင်နေဆဲ translation။
  * 🟡 **Needs Review** — AI ဘာသာပြန်ထားသော row များကို အလိုအလျောက် apply ခြင်း။
  * 🟢 **Approved** — Human review ပြီးဆုံး၊ release အသင့်။
* **Toolbar Filter**: Grid ကို status တစ်ခုချင်းစီ (All / Needs Review / Approved / Draft) ဖြင့် ချက်ချင်း filter လုပ်နိုင်ခြင်း။

---

### 7. 🧪 Pseudolocalization (Layout Stress Testing)
* **`qps-ploc` 1-Click Generation**: Source strings များကို extended accented homoglyphs (`[!!! Šééttîîññĝš !!!]`) ဖြင့် ပြောင်းပေးနိုင်ခြင်း။
* Translation စစ်စစ် မရောက်မီ Button/Card/Label များ text clipping ရှိမရှိ ကြိုစမ်းနိုင်ခြင်း။
* Interpolation placeholder များ 100% intact ထားပေးနိုင်ခြင်း။

---

### 8. 🔄 Multi-Format Import & Export (Platform မရွေး)
* **1-Click Multi-Platform Bundle ZIP**: Production-ready localization archive တစ်ခုလုံး export ထုတ်နိုင်ခြင်း:
  * `web-locales/{lang}.json` — Web / Next.js / React
  * `flutter-l10n/app_{lang}.arb` — Flutter
  * `ios-strings/{lang}.lproj/Localizable.strings` — iOS Xcode
  * `android-res/values-{lang}/strings.xml` — Android
  * `typescript/translations.d.ts` — TypeScript type declarations
* **Individual Exports**: Excel `.xlsx`, CSV `.csv` (UTF-8 BOM), JSON (flat/nested), YAML (Flutter / Rails), Android XML, iOS Strings
* **Smart Diff Merge**: File import ပြုလုပ်ရာတွင် new / modified / unchanged key များကို စစ်ဆေးပြီး merge mode ရွေးချယ်နိုင်ခြင်း

---

### 9. 🤝 Model Context Protocol (MCP) Server for AI Assistants
* **Claude Desktop, Cursor, Google Antigravity** နှင့် တိုက်ရိုက် ချိတ်ဆက်နိုင်ခြင်း — stdio JSON-RPC 2.0 ဖြင့်
* **MCP Tools ၅ ခု**:
  * `convert_zawgyi` — Myanmar font ပြောင်းနိုင်ခြင်း
  * `validate_variables` — Placeholder integrity check
  * `lint_translations` — Localization QA scanner
  * `read_translations` — JSON/ARB/XML/Strings file parser
  * `export_bundle` — Multi-platform code generation
* `mcp/` directory ထဲတွင် တည်ရှိပြီး `npm run mcp:build && npm run mcp:start` ဖြင့် run နိုင်ခြင်း

---

### 10. 🔍 Find & Replace Across All Languages
* **`Cmd+H`** ဖြင့် dedicated modal ဖွင့်ပြီး scope filter: All Languages / Keys Only / Context Only / Specific Language
* Match Case, Whole Word, **Regex** (**capture group `$1`, `$2` replacement** ပါ) support ပြုလုပ်ထားခြင်း
* Replace မလုပ်မီ match count ကြိုပြ၊ replace တိုင်း Undo history ထဲ register ဝင်ခြင်း

---

### 11. 🔒 100% Client-Side Privacy (Backend မရှိ)
* Backend server, database, tracking — လုံးဝမရှိ။ Code နှင့် data အားလုံး browser ထဲတွင်သာ run ပါသည်။
* OpenRouter API key များကို **AES-GCM 256-bit client-side encryption** ဖြင့် သိမ်းဆည်းထားပြီး proxy server မှ ဖြတ်မသွားပါ။
* Page reload / tab ပိတ်လျှင်လည်း Auto-Save ဖြင့် Data မပျောက်ပါ။

---

### 12. ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Cmd+K` | Command Palette |
| `Cmd+H` | Find & Replace |
| `Cmd+Z` | Undo |
| `Cmd+Y` | Redo |
| `Cmd+S` | .jsonlink project save |
| `Enter` / Double Click | Cell edit |
| `Esc` | Modal ပိတ် |
| Arrow Keys | Grid navigation |

---

## 🧪 Automated Testing

**107 Unit Tests, 12 Test Suites** — GitHub Actions CI ဖြင့် push တိုင်း auto-verify ပြုလုပ်ပါသည်။

| Test Suite | အကောင်အထည်ဖော်သည်များ |
|---|---|
| `linter.test.ts` | Whitespace, variable mismatch, length expansion, auto-fixer |
| `myanmarFont.test.ts` | Zawgyi detection, Rabbit ↔ Unicode converter |
| `exporter.test.ts` | Bundle ZIP, Android XML, iOS Strings, CSV BOM, TypeScript d.ts |
| `parser.test.ts` | JSON flatten/unflatten, YAML, Excel, XML, iOS strings |
| `openrouter.test.ts` | BYOK translation, glossary injection, JSON repair |
| `variables.test.ts` | ICU, Mustache, Printf tokenization |
| `findReplace.test.ts` | Scope, whole-word, regex |
| `crypto.test.ts` | AES-GCM encryption/decryption |
| `pseudoloc.test.ts` | Homoglyph, expansion, variable preservation |
| `project.test.ts` | .jsonlink serialization |

---

## 🚀 စတင်အသုံးပြုနည်း

```bash
# Clone & install
git clone https://github.com/pyaephyomaungdev/json-link.git
cd json-link
npm install

# Dev server
npm run dev

# Tests
npm test

# Production build
npm run build

# MCP Server (Claude Desktop / Cursor / Antigravity)
npm run mcp:build
npm run mcp:start
```

---

## 🌐 Links

* 🌍 **Live Web App**: https://json-link.pages.dev
* ⭐ **GitHub Repo**: https://github.com/pyaephyomaungdev/json-link
* 🤖 **MCP Docs**: `mcp/README.md`

---

## 📣 Post Content (Myanmar / မြန်မာ)

### 🏷️ Tagline
> Developer များအတွက် Free & Open-Source AI i18n Workspace — Excel UX, Myanmar Zawgyi Converter, MCP Server, Multi-Platform Export ပါဝင်ပြီး Backend လုံးဝမရှိ!

### 📋 Post Description (LinkedIn / Facebook / Product Hunt)

React, Flutter, Android, iOS app တွေ build လုပ်ရင်းနဲ့ i18n / localization ကိစ္စတွေနဲ့ မပင်ပန်းဖူးသေးတဲ့ developer မရှိဘူးလောက်ပါပဲ 😅

ဒါကြောင့် **JSON Link** ကို ဖန်တီးလိုက်ပါတယ် — 100% Browser-Based, Open-Source Localization Spreadsheet!

**✨ Features အဓိကများ:**

📊 Excel-style spreadsheet interface — formula bar, drag column resize, freeze panes, keyboard nav
🔤 Myanmar Zawgyi ⇄ Unicode auto-detector & 1-click converter (Rabbit algorithm)
🤖 AI batch translation (OpenRouter, 20+ models) — ဘာသာစကားအားလုံး တပြိုင်နက်ဘာသာပြန်
🔎 Localization QA Linter — whitespace, variable mismatches, duplicates, untranslated auto-detect
✅ Row review workflow — Draft / Needs Review / Approved
📦 1-click multi-platform bundle ZIP (Web/Flutter/Android/iOS/TypeScript)
🤝 MCP server — Claude Desktop, Cursor, Antigravity နဲ့ native ချိတ်ဆက်နိုင်
🔒 Backend မရှိ — data အားလုံး browser ထဲမှာပဲ / AES-256 encrypted API keys

107 unit tests ✅ | GitHub Actions CI ✅ | MIT License ✅

🌐 Live Demo: https://json-link.pages.dev
⭐ GitHub: https://github.com/pyaephyomaungdev/json-link

### 🏷️ Hashtags
`#opensource` `#i18n` `#localization` `#webdev` `#react` `#flutter` `#android` `#ios` `#myanmar` `#ai` `#mcp` `#typescript` `#json` `#developertools` `#productivity`

---

## License

MIT License — ပုဂ္ဂိုလ်တိုင်း၊ team တိုင်းအတွက် အခမဲ့ open source ဖြစ်ပါသည်။
