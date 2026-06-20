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

// 从源文件头部注释里读关键词，生成标签。
// 支持任意注释符号（# // *）后写：tags / 标签 / keywords / 关键词，分隔符可用 , ， 、 空格
// 例：  # tags: 算法, 单调栈, 双指针      //  // keywords: recursion sorting
function parseTagsFromComments(content) {
  const head = content.split('\n').slice(0, 20).join('\n')
  const m = head.match(/(?:#|\/\/|\*|--)\s*(?:tags|标签|keywords|关键词)\s*[:：]\s*(.+)/i)
  if (!m) return []
  return m[1]
    .replace(/\*\/\s*$/, '')          // 去掉块注释结尾 */
    .split(/[,，、;；\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
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
#editor{height:calc(100vh - 52px)}
</style>
</head>
<body>
<div class="header">
  <div><span class="filename">${filename}</span><span class="file-type">${label}</span><span class="lines" id="lines"></span></div>
  <div class="actions">
    <button class="btn btn-copy" id="copyBtn" onclick="copyCode()">Copy</button>
    <button class="btn btn-dl" onclick="downloadCode()">Download</button>
    <button class="btn btn-reset" onclick="resetCode()">Reset</button>
  </div>
</div>
<div id="editor"></div>
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
});
function current(){return ED?ED.getValue():CODE;}
function copyCode(){navigator.clipboard.writeText(current()).then(()=>{const b=document.getElementById('copyBtn');b.classList.add('copied');b.textContent='Copied!';setTimeout(()=>{b.classList.remove('copied');b.textContent='Copy';},1500);});}
function downloadCode(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([current()],{type:'text/plain'}));a.download=FILENAME;a.click();}
function resetCode(){if(ED)ED.setValue(CODE);}
<\/script>
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
  const height = Math.min(Math.max(lineCount * 19 + 140, 320), 820)

  // 标签 = 语言名 + 注释里手写的关键词（去重）
  const customTags = parseTagsFromComments(content)
  const tags = [label, ...customTags].filter((t, i, a) => a.indexOf(t) === i)
  const tagsYaml = tags.map(t => `  - ${t}`).join('\n')

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

<iframe :src="withBase('${htmlRel}')" width="100%" height="${height}px" style="border:1px solid #3c3c3c;border-radius:8px" title="${file} - Monaco Editor"></iframe>
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
