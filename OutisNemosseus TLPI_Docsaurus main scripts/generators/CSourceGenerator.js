/**
 * @fileoverview C Source code generator - generates standalone HTML with Monaco
 * @module generators/CSourceGenerator
 */

const BaseGenerator = require('./BaseGenerator');
const { generateSidebarLabel } = require('../utils/helpers');

class CSourceGenerator extends BaseGenerator {
  getType() {
    return 'csource';
  }

  generate(programInfo, fileData) {
    const { displayName } = programInfo;
    const { filename, content, config } = fileData;
    const escapedCode = (content || '').replace(/\/g, '\\').replace(/`/g, '\`').replace(/\$/g, '\$');
    const lang = this.getMonacoLanguage(config.codeLanguage);
    return this.buildHtml(filename, displayName, escapedCode, config, lang);
  }

  buildHtml(filename, displayName, code, config, lang) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename} - TLPI</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1e1e1e;color:#d4d4d4;min-height:100vh}
    .header{background:#252526;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3c3c3c;flex-wrap:wrap;gap:12px}
    .file-info{display:flex;flex-direction:column;gap:4px}
    .filename{font-size:1.25rem;font-weight:600;color:#fff}
    .filepath{font-size:0.875rem;color:#808080}
    .file-type{display:inline-block;padding:2px 8px;background:${config.color||'#555'};color:#fff;border-radius:4px;font-size:0.75rem;font-weight:600;margin-left:8px}
    .actions{display:flex;gap:12px}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border:none;border-radius:6px;font-size:0.875rem;font-weight:500;cursor:pointer;transition:all 0.2s}
    .btn-copy{background:#0e639c;color:#fff}
    .btn-copy:hover{background:#1177bb}
    .btn-copy.copied{background:#16825d}
    .btn-download{background:#10b981;color:#fff}
    .btn-download:hover{background:#059669}
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
      <div class="filename">${filename}<span class="file-type">${config.label}</span></div>
      <div class="filepath">${displayName}</div>
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"><\/script>
  <script>
    const CODE=\`${code}\`;
    const FILENAME='${filename}';
    document.getElementById('lines').textContent=CODE.split('\n').length+' lines';
    require.config({paths:{vs:'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'}});
    require(['vs/editor/editor.main'],function(){
      monaco.editor.create(document.getElementById('editor'),{
        value:CODE,language:'${lang}',theme:'vs-dark',readOnly:true,automaticLayout:true,
        fontSize:14,lineNumbers:'on',minimap:{enabled:true},scrollBeyondLastLine:false,
        padding:{top:16,bottom:16},folding:true,bracketPairColorization:{enabled:true}
      });
    });
    function copyCode(){
      navigator.clipboard.writeText(CODE).then(()=>{
        document.getElementById('copyBtn').classList.add('copied');
        document.getElementById('copyText').textContent='Copied!';
        showToast('Copied to clipboard!');
        setTimeout(()=>{document.getElementById('copyBtn').classList.remove('copied');document.getElementById('copyText').textContent='Copy';},2000);
      });
    }
    function downloadCode(){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(new Blob([CODE],{type:'text/plain'}));
      a.download=FILENAME;a.click();
      showToast('Download started!');
    }
    function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
  <\/script>
</body>
</html>`;
  }

  getMonacoLanguage(lang) {
    return {c:'c',shell:'shell',sh:'shell',bash:'shell'}[lang]||'plaintext';
  }
}

class CHeaderGenerator extends CSourceGenerator {
  getType() { return 'cheader'; }
}

class ShellGenerator extends CSourceGenerator {
  getType() { return 'shell'; }
}

module.exports = { CSourceGenerator, CHeaderGenerator, ShellGenerator };
