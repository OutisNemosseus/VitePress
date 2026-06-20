const fs = require('fs');

const script = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TLPI_DIR = path.join(__dirname, '..', 'tlpi-dist');
const OUTPUT_DIR = path.join(__dirname, '..', 'static', 'code-pages');

const FILE_TYPES = {
  '.c': { label: 'C Source', color: '#555555', lang: 'c' },
  '.h': { label: 'C Header', color: '#6a5acd', lang: 'c' },
  '.sh': { label: 'Shell Script', color: '#4eaa25', lang: 'shell' },
};

function escapeCode(code) {
  return code.replace(/\\/g, '\\\\').replace(/\\`/g, '\\\\`').replace(/\$/g, '\\$');
}

function getHtmlTemplate() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{FILENAME}} - TLPI</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1e1e1e;color:#d4d4d4;min-height:100vh}
    .header{background:#252526;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3c3c3c;flex-wrap:wrap;gap:12px}
    .file-info{display:flex;flex-direction:column;gap:4px}
    .filename{font-size:1.25rem;font-weight:600;color:#fff}
    .category{font-size:0.875rem;color:#808080}
    .file-type{display:inline-block;padding:2px 8px;background:{{COLOR}};color:#fff;border-radius:4px;font-size:0.75rem;font-weight:600;margin-left:8px}
    .actions{display:flex;gap:12px}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border:none;border-radius:6px;font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s}
    .btn-copy{background:#0e639c;color:#fff}.btn-copy:hover{background:#1177bb}.btn-copy.copied{background:#16825d}
    .btn-download{background:#10b981;color:#fff}.btn-download:hover{background:#059669}
    .btn svg{width:16px;height:16px}
    #editor{height:calc(100vh - 80px)}
    .toast{position:fixed;bottom:24px;right:24px;background:#16825d;color:#fff;padding:12px 24px;border-radius:8px;font-size:0.875rem;opacity:0;transform:translateY(20px);transition:all 0.3s;z-index:1000}
    .toast.show{opacity:1;transform:translateY(0)}
    .lines{font-size:0.75rem;color:#6b7280;margin-top:4px}
  </style>
</head>
<body>
  <div class="header">
    <div class="file-info">
      <div class="filename">{{FILENAME}}<span class="file-type">{{LABEL}}</span></div>
      <div class="category">{{CATEGORY}}</div>
      <div class="lines" id="lines"></div>
    </div>
    <div class="actions">
      <button class="btn btn-copy" id="copyBtn" onclick="copyCode()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        <span id="copyText">Copy</span>
      </button>
      <button class="btn btn-download" onclick="downloadCode()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        <span>Download</span>
      </button>
    </div>
  </div>
  <div id="editor"></div>
  <div class="toast" id="toast"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
  <script>
    const CODE=\\`{{CODE}}\\`;
    const FILENAME='{{FILENAME}}';
    document.getElementById('lines').textContent=CODE.split('\\n').length+' lines';
    require.config({paths:{vs:'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'}});
    require(['vs/editor/editor.main'],function(){
      monaco.editor.create(document.getElementById('editor'),{
        value:CODE,language:'{{LANG}}',theme:'vs-dark',readOnly:true,automaticLayout:true,
        fontSize:14,lineNumbers:'on',minimap:{enabled:true},scrollBeyondLastLine:false,
        padding:{top:16,bottom:16},folding:true,bracketPairColorization:{enabled:true}
      });
    });
    function copyCode(){navigator.clipboard.writeText(CODE).then(()=>{document.getElementById('copyBtn').classList.add('copied');document.getElementById('copyText').textContent='Copied!';showToast('Copied!');setTimeout(()=>{document.getElementById('copyBtn').classList.remove('copied');document.getElementById('copyText').textContent='Copy';},2000);});}
    function downloadCode(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([CODE],{type:'text/plain'}));a.download=FILENAME;a.click();showToast('Download started!');}
    function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
  </script>
</body>
</html>\`;
}

function generateHtml(filename, code, category, config) {
  return getHtmlTemplate()
    .replace(/{{FILENAME}}/g, filename)
    .replace(/{{CATEGORY}}/g, category)
    .replace(/{{COLOR}}/g, config.color)
    .replace(/{{LABEL}}/g, config.label)
    .replace(/{{LANG}}/g, config.lang)
    .replace(/{{CODE}}/g, escapeCode(code));
}

function getIndexTemplate() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TLPI Source Code Browser</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1e1e1e;color:#d4d4d4;min-height:100vh;padding:24px}
    .container{max-width:1400px;margin:0 auto}
    h1{color:#fff;margin-bottom:8px;font-size:2rem}
    .subtitle{color:#808080;margin-bottom:32px}
    .stats{background:#252526;border-radius:8px;padding:16px 24px;margin-bottom:32px;display:flex;gap:32px;flex-wrap:wrap}
    .stat{text-align:center}.stat-value{font-size:1.5rem;font-weight:700;color:#4ec9b0}.stat-label{font-size:0.875rem;color:#808080}
    .category{margin-bottom:32px}.category-title{color:#569cd6;font-size:1.25rem;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #3c3c3c}
    .file-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
    .file-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:16px;display:flex;align-items:center;gap:12px;text-decoration:none;color:#d4d4d4;transition:all 0.2s}
    .file-card:hover{background:#2d2d2d;border-color:#569cd6;transform:translateY(-2px)}
    .file-icon{width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.7rem;color:#fff;flex-shrink:0}
    .file-name{font-size:0.875rem;word-break:break-word}
  </style>
</head>
<body><div class="container">
  <h1>TLPI Source Code Browser</h1>
  <p class="subtitle">The Linux Programming Interface - Code Examples with Monaco Editor</p>
  {{STATS}}{{CONTENT}}
</div></body></html>\`;
}

function generateIndex(files) {
  const grouped = {};
  files.forEach(f => { if (!grouped[f.category]) grouped[f.category] = []; grouped[f.category].push(f); });
  const categories = Object.keys(grouped).sort();
  const cFiles = files.filter(f => f.ext === '.c').length;
  const hFiles = files.filter(f => f.ext === '.h').length;
  const shFiles = files.filter(f => f.ext === '.sh').length;
  
  let stats = '
