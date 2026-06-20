// 扫描 source/ 下的源文件：
//  1) 为每个文件生成一个独立的 Monaco（VS Code 内核）HTML 页 → docs/public/code-pages/<语言>/
//  2) 生成对应文章 docs/posts/<语言>/，用 <iframe> 嵌入该 HTML 页
//  3) 自动生成按语言分组的侧边栏
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const SOURCE_DIR = path.join(root, 'source')
const DOCS_DIR = path.join(root, 'docs')
const POSTS_DIR = path.join(DOCS_DIR, 'posts')
const CODE_PAGES_DIR = path.join(DOCS_DIR, 'public', 'code-pages')
const SIDEBAR_FILE = path.join(DOCS_DIR, '.vitepress', 'generated-sidebar.json')

const MONACO = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'

// 扩展名 → { Monaco 语言 id, 标签名, 子目录, 分类名 }
const LANG = {
  '.py': { language: 'python', label: 'Python', dir: 'python', category: 'Python' },
  '.java': { language: 'java', label: 'Java', dir: 'java', category: 'Java' },
  '.c': { language: 'c', label: 'C', dir: 'c', category: 'C' },
  '.h': { language: 'c', label: 'C', dir: 'c', category: 'C' },
  '.cpp': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.cc': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.cxx': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' },
  '.hpp': { language: 'cpp', label: 'C++', dir: 'cpp', category: 'C++' }
}

const DIR_CATEGORY = { python: 'Python', java: 'Java', c: 'C', cpp: 'C++' }
const CATEGORY_ORDER = ['Python', 'Java', 'C', 'C++', '随笔']

const pad = n => String(n).padStart(2, '0')
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const prettify = name =>
  name.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const slugify = name =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ============================================================
// 注释指令系统（符合开闭原则：加一种区块 = 在 SECTIONS 加一行）
// ============================================================

// 标签指令名（tags / 标签 / keywords / 关键词）
const TAG_NAMES = 'tags|标签|keywords|关键词'

// 区块注册表：在注释里写「title: 内容」就会渲染成对应的提示框。
// 想新增区块（如“复杂度”“来源”），只要在这里加一行，无需改任何解析/渲染逻辑。
//   names     ：可触发该区块的关键词（| 分隔，大小写不限）
//   title     ：渲染出来的标题
//   container ：VitePress 容器样式 tip(绿) / warning(黄) / danger(红) / info(灰)
const SECTIONS = [
  { names: '题目|题|problem|question', title: '题目',   container: 'tip' },
  { names: '错误|错误处|踩坑|mistake|bug', title: '错误处', container: 'warning' },
  { names: '遗忘|遗忘处|易忘|forgot', title: '遗忘处', container: 'danger' },
  { names: '延展|拓展|相关|相关题|related', title: '延展',   container: 'info' }
]

// 所有指令名合集——用于判断“某行是不是另一条指令”，从而界定区块边界
const ALL_DIRECTIVES = [TAG_NAMES, ...SECTIONS.map(s => s.names)].join('|')

const isCommentLine = line => /^\s*(?:#|\/\/|\*|\/\*|\*\/)/.test(line)
const stripComment = line =>
  line.replace(/^\s*(?:#|\/\/|\*\/|\/\*|\*)\s?/, '').replace(/\*\/\s*$/, '')
const isDirectiveLine = stripped =>
  new RegExp(`^\\s*(?:${ALL_DIRECTIVES})\\s*[:：]`, 'i').test(stripped)
// 分隔线（==== ---- **** 之类的装饰），用于界定区块结尾
const isSeparator = stripped => /^[=\-*_~#\s]{3,}$/.test(stripped)

// 通用区块解析器：按指令名提取一段（单行或多行注释），碰到别的指令/非注释行就停
function parseSection(content, names) {
  const lines = content.split('\n')
  const re = new RegExp(`^\\s*(?:#|//|\\*|/\\*)\\s*(?:${names})\\s*[:：]\\s*(.*)$`, 'i')
  let start = -1
  let first = ''
  for (let i = 0; i < Math.min(lines.length, 60); i++) {
    const m = lines[i].match(re)
    if (m) { start = i; first = m[1]; break }
  }
  if (start === -1) return ''
  const out = []
  if (first.trim()) out.push(first.trim())
  for (let i = start + 1; i < lines.length; i++) {
    if (!isCommentLine(lines[i])) break  // 注释块结束
    const s = stripComment(lines[i])
    if (s.trim() === '') break           // 空注释行
    if (isSeparator(s)) break            // 分隔线 ==== ----
    if (isDirectiveLine(s)) break        // 碰到别的指令（含其它区块/标签）就停
    out.push(s)
  }
  return out.join('\n').trim()
}

// 标签：复用通用解析器拿到那一段，再切成数组
function parseTagsFromComments(content) {
  const raw = parseSection(content, TAG_NAMES)
  return raw.split(/[,，、;；\s]+/).map(s => s.trim()).filter(Boolean)
}

// 把所有命中的区块按 SECTIONS 顺序渲染成 VitePress 提示框
function buildSectionBlocks(content) {
  return SECTIONS.map(sec => {
    const text = parseSection(content, sec.names)
    return text ? `::: ${sec.container} ${sec.title}\n${text}\n:::\n\n` : ''
  }).join('')
}

function walkMd(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkMd(full))
    else if (entry.name.endsWith('.md')) out.push(full)
  }
  return out
}

// 独立的 Monaco 全屏 HTML 页（VS Code 风格），从 CDN 加载编辑器内核
function buildMonacoHtml(filename, code, lang, label) {
  const codeJs = JSON.stringify(code).replace(/<\/script>/gi, '<\\/script>')

  // 只有 Python 能在浏览器里跑（Pyodide / WebAssembly）
  const isPython = lang === 'python'
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
  const outputPanel = isPython
    ? `<div id="output">
  <div class="out-bar"><span>Output</span><button class="out-clear" onclick="clearOut()">Clear</button></div>
  <pre id="outBody"></pre>
</div>`
    : ''
  const pyScript = isPython
    ? `<script>
const PYODIDE='${PYODIDE}';
let pyReady=null;
function showOut(){document.getElementById('output').style.display='flex';if(ED)ED.layout();}
function setOut(t){document.getElementById('outBody').textContent=t;}
function appendOut(t){var o=document.getElementById('outBody');o.textContent+=t;o.scrollTop=o.scrollHeight;}
function clearOut(){setOut('');}
function ensurePy(){
  if(pyReady)return pyReady;
  showOut();setOut('\\u23F3 Loading Python runtime (first run downloads ~10MB)...');
  pyReady=new Promise((res,rej)=>{var s=document.createElement('script');s.src=PYODIDE+'pyodide.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);})
    .then(()=>loadPyodide({indexURL:PYODIDE}));
  return pyReady;
}
async function runCode(){
  var b=document.getElementById('runBtn');b.disabled=true;var t=b.textContent;b.textContent='Running...';
  showOut();
  try{
    var py=await ensurePy();
    setOut('');
    var write=s=>appendOut(s.endsWith('\\n')?s:s+'\\n');
    py.setStdout({batched:write});py.setStderr({batched:write});
    // input() 支持：弹窗输入一行，并回显到输出
    py.setStdin({stdin:()=>{var r=window.prompt('input():');if(r===null)return '';appendOut('> '+r+'\\n');return r+'\\n';}});
    await py.runPythonAsync(getCode());
    if(!document.getElementById('outBody').textContent)appendOut('(no output)');
  }catch(e){appendOut('\\n'+e);}
  finally{b.disabled=false;b.textContent=t;}
}
// 注册「运行」按钮（解耦：只需在这里加一条）
registerAction({id:'run',cls:'btn-run',label:'&#9654; Run (Ctrl+Enter)',title:'Ctrl+Enter',run:function(){runCode();}});
<\/script>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${filename}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1e1e1e;color:#d4d4d4}
.header{background:#252526;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3c3c3c;gap:12px;flex-wrap:wrap}
.filename{font-size:.95rem;font-weight:600;color:#fff}
.file-type{display:inline-block;padding:2px 8px;background:#0e639c;color:#fff;border-radius:4px;font-size:.72rem;font-weight:600;margin-left:8px}
.lines{font-size:.75rem;color:#808080;margin-left:8px}
.actions{display:flex;gap:8px}
.btn{padding:6px 14px;border:none;border-radius:6px;font-size:.8rem;font-weight:500;cursor:pointer;color:#fff}
.btn-copy{background:#0e639c}.btn-copy:hover{background:#1177bb}.btn-copy.copied{background:#16825d}
.btn-dl{background:#10b981}.btn-dl:hover{background:#059669}
.btn-reset{background:#6b7280}.btn-reset:hover{background:#7c8493}
.btn-run{background:#7c3aed}.btn-run:hover{background:#8b5cf6}
.btn:disabled{opacity:.6;cursor:default}
body{display:flex;flex-direction:column}
.header{flex:0 0 auto}
#editor{flex:1 1 auto;min-height:0}
#output{display:none;flex-direction:column;height:140px;flex:0 0 auto;border-top:1px solid #3c3c3c;background:#1e1e1e}
.out-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 16px;background:#252526;border-bottom:1px solid #3c3c3c;font-size:.8rem;color:#cbd5e1}
.out-clear{background:#374151;color:#fff;border:none;border-radius:4px;padding:3px 10px;font-size:.75rem;cursor:pointer}
#outBody{margin:0;padding:12px 16px;overflow:auto;flex:1;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap;color:#d4d4d4}
</style>
</head>
<body>
<div class="header">
  <div><span class="filename">${filename}</span><span class="file-type">${label}</span><span class="lines" id="lines"></span></div>
  <div class="actions"></div>
</div>
<div id="editor"></div>
${outputPanel}
<script src="${MONACO}/loader.min.js"><\/script>
<script>
const CODE=${codeJs};
const FILENAME=${JSON.stringify(filename)};
let ED=null;
document.getElementById('lines').textContent=CODE.split('\\n').length+' lines';
require.config({paths:{vs:'${MONACO}'}});
require(['vs/editor/editor.main'],function(){
  ED=monaco.editor.create(document.getElementById('editor'),{
    value:CODE,language:'${lang}',theme:'vs-dark',readOnly:false,automaticLayout:true,
    fontSize:14,lineNumbers:'on',minimap:{enabled:true},scrollBeyondLastLine:false,
    padding:{top:14,bottom:14},folding:true,bracketPairColorization:{enabled:true}
  });
  ED.onDidChangeModelContent(()=>{document.getElementById('lines').textContent=ED.getValue().split('\\n').length+' lines';});
  // Ctrl/Cmd + Enter 运行（仅 Python 页有 runCode）
  ED.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,function(){if(typeof runCode==='function')runCode();});
  mountActions();
});
function getCode(){return ED?ED.getValue():CODE;}
function setCode(v){if(ED)ED.setValue(v);}
// ===== 按钮「稳定骨架」：注册表 + 统一挂载。日后加按钮只需 registerAction({...}) 一行 =====
const ACTIONS=[];
function registerAction(a){ACTIONS.push(a);}
function mountActions(){
  var box=document.querySelector('.actions');box.innerHTML='';
  ACTIONS.forEach(function(a){
    var b=document.createElement('button');
    b.className='btn '+(a.cls||'');
    if(a.id)b.id=a.id+'Btn';
    if(a.title)b.title=a.title;
    b.innerHTML=a.label;
    b.addEventListener('click',function(){a.run({btn:b,getCode:getCode,setCode:setCode,editor:ED});});
    box.appendChild(b);
  });
}
// 核心按钮（业务回调只管自己的事，与骨架解耦）
registerAction({id:'copy',cls:'btn-copy',label:'Copy',run:function(ctx){navigator.clipboard.writeText(ctx.getCode()).then(function(){ctx.btn.classList.add('copied');ctx.btn.textContent='Copied!';setTimeout(function(){ctx.btn.classList.remove('copied');ctx.btn.textContent='Copy';},1500);});}});
registerAction({id:'download',cls:'btn-dl',label:'Download',run:function(ctx){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ctx.getCode()],{type:'text/plain'}));a.download=FILENAME;a.click();}});
registerAction({id:'reset',cls:'btn-reset',label:'Reset',run:function(ctx){ctx.setCode(CODE);}});
<\/script>
${pyScript}
</body>
</html>`
}

fs.mkdirSync(SOURCE_DIR, { recursive: true })
fs.mkdirSync(POSTS_DIR, { recursive: true })

// 1) 清理上一次的产物：带 source: 的自动文章 + 整个 code-pages 目录
for (const md of walkMd(POSTS_DIR)) {
  if (/^source:\s*/m.test(fs.readFileSync(md, 'utf8'))) fs.rmSync(md)
}
fs.rmSync(CODE_PAGES_DIR, { recursive: true, force: true })

// 2) 生成 HTML 页 + 文章
const files = fs
  .readdirSync(SOURCE_DIR)
  .filter(f => LANG[path.extname(f).toLowerCase()])

const usedSlugs = new Set()
let count = 0
for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  const { language, label, dir } = LANG[ext]
  const base = path.basename(file, ext)

  let slug = slugify(base)
  if (usedSlugs.has(`${dir}/${slug}`)) slug = `${slug}-${ext.slice(1)}`
  usedSlugs.add(`${dir}/${slug}`)

  const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8')
  const lineCount = content.split('\n').length
  const height = Math.min(Math.max(lineCount * 24 + 700, 700), 1600)

  // 标签 = 语言名 + 注释里手写的关键词（去重）
  const customTags = parseTagsFromComments(content)
  const tags = [label, ...customTags].filter((t, i, a) => a.indexOf(t) === i)
  const tagsYaml = tags.map(t => `  - ${t}`).join('\n')

  // 注释区块（题目/错误处/遗忘处/延展…，全由 SECTIONS 驱动）
  const sectionBlocks = buildSectionBlocks(content)
  // 代码默认展开规则：Python 展开，其它语言收起
  const openAttr = language === 'python' ? ' open' : ''

  // 2a) 独立 Monaco HTML 页 → docs/public/code-pages/<dir>/<slug>.html
  const htmlDir = path.join(CODE_PAGES_DIR, dir)
  fs.mkdirSync(htmlDir, { recursive: true })
  fs.writeFileSync(path.join(htmlDir, `${slug}.html`), buildMonacoHtml(file, content, language, label), 'utf8')

  // 2b) 文章（用 iframe 嵌入上面的 HTML 页）→ docs/posts/<dir>/<slug>.md
  const outDir = path.join(POSTS_DIR, dir)
  fs.mkdirSync(outDir, { recursive: true })
  const htmlRel = `/code-pages/${dir}/${slug}.html`

  const md = `---
title: ${prettify(base)}
date: ${today()}
tags:
${tagsYaml}
source: ${file}
---

<script setup>
import { withBase } from 'vitepress'
</script>

# ${prettify(base)}

> 由 \`source/${file}\` 自动生成 · ${label}

${sectionBlocks}<details class="code-fold"${openAttr}>
<summary>📄 显示 / 隐藏代码</summary>

<iframe :src="withBase('${htmlRel}')" width="100%" height="${height}px" style="border:1px solid #3c3c3c;border-radius:8px" title="${file} - Monaco Editor"></iframe>

</details>
`
  fs.writeFileSync(path.join(outDir, `${slug}.md`), md, 'utf8')
  count++
  console.log(`✓ ${file} → posts/${dir}/${slug}.md  +  code-pages/${dir}/${slug}.html`)
}

// 3) 扫描所有文章，按分类生成侧边栏
const groups = {}
for (const md of walkMd(POSTS_DIR)) {
  const rel = path.relative(POSTS_DIR, md).split(path.sep)
  const topDir = rel.length > 1 ? rel[0] : ''
  const category = DIR_CATEGORY[topDir] || '随笔'
  const m = fs.readFileSync(md, 'utf8').match(/^title:\s*["']?(.+?)["']?\s*$/m)
  const title = m ? m[1] : path.basename(md, '.md')
  const link = '/' + path.relative(DOCS_DIR, md).replace(/\\/g, '/').replace(/\.md$/, '')
  ;(groups[category] ||= []).push({ text: title, link })
}

const sidebar = CATEGORY_ORDER.filter(c => groups[c]).map(c => ({
  text: c,
  collapsed: false,
  items: groups[c].sort((a, b) => a.text.localeCompare(b.text))
}))

fs.mkdirSync(path.dirname(SIDEBAR_FILE), { recursive: true })
fs.writeFileSync(SIDEBAR_FILE, JSON.stringify(sidebar, null, 2), 'utf8')

console.log(`\nGenerated ${count} post(s); sidebar: ${sidebar.map(g => g.text).join(', ') || '(none)'}`)
