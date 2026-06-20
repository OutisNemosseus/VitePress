<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: 'plaintext' },
  filename: { type: String, default: 'code.txt' }
})

const editorEl = ref(null)
const copied = ref(false)
let editor = null

const lineCount = props.code.split('\n').length
const height = Math.min(Math.max(lineCount * 20 + 40, 220), 640)

const MONACO_VERSION = '0.45.0'
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs`

// 单例加载 Monaco（VS Code 编辑器内核），整页只加载一次
let monacoPromise = null
function loadMonaco() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.monaco) return Promise.resolve(window.monaco)
  if (monacoPromise) return monacoPromise
  monacoPromise = new Promise((resolve, reject) => {
    const ready = () => {
      window.require.config({ paths: { vs: CDN } })
      window.require(['vs/editor/editor.main'], () => resolve(window.monaco))
    }
    if (window.require) return ready()
    const s = document.createElement('script')
    s.src = `${CDN}/loader.min.js`
    s.onload = ready
    s.onerror = reject
    document.head.appendChild(s)
  })
  return monacoPromise
}

onMounted(async () => {
  const monaco = await loadMonaco()
  if (!monaco || !editorEl.value) return
  editor = monaco.editor.create(editorEl.value, {
    value: props.code,
    language: props.language,
    theme: 'vs-dark',
    readOnly: true,
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    padding: { top: 16, bottom: 16 },
    folding: true,
    bracketPairColorization: { enabled: true }
  })
})

onBeforeUnmount(() => { if (editor) editor.dispose() })

function copyCode() {
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  })
}
function downloadCode() {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([props.code], { type: 'text/plain' }))
  a.download = props.filename
  a.click()
}
</script>

<template>
  <div class="monaco-viewer">
    <div class="mv-header">
      <div class="mv-file">
        <span class="mv-name">{{ filename }}</span>
        <span class="mv-lines">{{ lineCount }} lines</span>
      </div>
      <div class="mv-actions">
        <button class="mv-btn" :class="{ copied }" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
        <button class="mv-btn mv-dl" @click="downloadCode">Download</button>
      </div>
    </div>
    <div ref="editorEl" class="mv-editor" :style="{ height: height + 'px' }"></div>
  </div>
</template>

<style scoped>
.monaco-viewer { border: 1px solid #3c3c3c; border-radius: 8px; overflow: hidden; margin: 20px 0; background: #1e1e1e; }
.mv-header { background: #252526; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3c3c3c; gap: 12px; flex-wrap: wrap; }
.mv-name { color: #fff; font-weight: 600; font-size: 0.95rem; }
.mv-lines { color: #808080; font-size: 0.8rem; margin-left: 10px; }
.mv-actions { display: flex; gap: 8px; }
.mv-btn { padding: 6px 14px; border: none; border-radius: 6px; font-size: 0.8rem; font-weight: 500; cursor: pointer; background: #0e639c; color: #fff; }
.mv-btn:hover { background: #1177bb; }
.mv-btn.copied { background: #16825d; }
.mv-dl { background: #10b981; }
.mv-dl:hover { background: #059669; }
.mv-editor { width: 100%; }
</style>
