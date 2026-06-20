---
title: 设计模式与开闭原则
---

# 本项目的设计模式与开闭原则

这篇文档说明本站的构建脚本（`scripts/generate-posts.mjs`）和主题（`docs/.vitepress/theme/`）里用到了哪些设计模式、它们如何满足**开闭原则（Open/Closed Principle，OCP）**，以及**未来扩展时该改哪一段 JS**。

> **开闭原则**：软件实体应当对**扩展开放**、对**修改关闭**。
> 通俗讲：加新功能时，**只新增**代码（加一条配置 / 注册一个回调），**不动**已有的核心逻辑。

---

## 总览

| 模式 | 在哪里 | 作用 | 怎么扩展（OCP） |
|------|--------|------|----------------|
| 注册表 / 查找表 | `LANG`、`DIR_CATEGORY`、`CATEGORY_ORDER` | 语言 → 配置 的映射 | 加一门语言 = 加一条 `LANG` 条目 |
| 策略模式 | `parseSection`（由 `SECTIONS` 驱动）、标签页 all/any | 可替换的“解析/过滤”算法 | 加区块=加一行 `SECTIONS` 配置 |
| 命令模式 / 回调 | 生成 HTML 里的 `ACTIONS` + `registerAction` + `mountActions` | 按钮“触发”与“行为”解耦 | 加按钮 = `registerAction({...})` 一行 |
| 单例 / 惰性初始化 | Pyodide 的 `pyReady`、ESM 模块 | 全局只初始化一次 | 无需改动 |
| 建造者 / 模板方法 | `buildMonacoHtml` | 按部件拼出独立页 | 加部件用条件拼接 |
| 装饰 / 组合 | 主题 `extends DefaultTheme` + `Layout` 插槽 + `enhanceApp` | 在默认主题上叠加功能 | 加插槽/组件，不改默认主题 |
| 观察者 | `onDidChangeModelContent`、`addEventListener`、Vue `ref/computed` | 事件 → 响应 | 加监听者 |
| 迭代器 | `walkMd`、`for...of`、`createContentLoader` | 统一遍历 | 直接复用 |

---

## 1. 注册表 / 查找表（Registry）— 真正的 name→config 映射

`scripts/generate-posts.mjs` 里的 `LANG` 是一个**字典**，把“扩展名”映射到“这门语言的所有配置”：

```js
const LANG = {
  '.py':  { language: 'python', label: 'Python', dir: 'python', category: 'Python' },
  '.java':{ language: 'java',   label: 'Java',   dir: 'java',   category: 'Java' },
  '.c':   { language: 'c',      label: 'C',      dir: 'c',      category: 'C' },
  '.cpp': { language: 'cpp',    label: 'C++',    dir: 'cpp',    category: 'C++' },
  // ...
}
```

主循环对每个源文件做的事情，全部**从这张表里查**，自己不写任何 `if (ext === '.py')`：

```js
const { language, label, dir } = LANG[ext]   // ← 查表，不是写死的分支
```

**为什么符合 OCP**：想支持一门新语言时，主循环、`buildMonacoHtml`、侧边栏生成**都不用动**，只在 `LANG` 里**加一行**。这就是“对扩展开放、对修改关闭”。

> 这才是严格意义的**注册表**：`{ 名字: 行为/配置 }`，按名字查。

---

## 2. 策略模式（Strategy）— 可替换的解析算法

注释区块的提取由**一张配置表 `SECTIONS` + 一个通用解析器 `parseSection`** 驱动，
“题目 / 错误处 / 遗忘处 / 延展”都是表里的数据，而不是各写一个函数（详见 [场景 C](#场景-c-新增注释区块-错误处-遗忘处-延展-难度-来源)）：

```js
const SECTIONS = [
  { names:'题目|problem', title:'题目', container:'tip' },
  { names:'错误|mistake', title:'错误处', container:'warning' },
  // ...加一行就是加一种区块
]
function parseSection(content, names) { /* 通用：按指令名提取一段注释 */ }
```

连标签解析也复用同一个通用解析器（零重复）：

```js
function parseTagsFromComments(content) {
  return parseSection(content, TAG_NAMES).split(/[,，、;；\s]+/).filter(Boolean)
}
```

标签页 `docs/tags.md` 里的“同时满足 / 任一满足”也是策略——**同一份数据，换一个判定函数**：

```js
mode.value === 'all'
  ? selected.value.every(t => p.tags.includes(t))   // 策略 A：交集
  : selected.value.some(t => p.tags.includes(t))    // 策略 B：并集
```

**为什么符合 OCP**：想加“提取难度”“提取来源”，只要再写一个 `parseXxxFromComments`，不动已有解析逻辑。

---

## 3. 命令模式 / 回调（Command / Callback）— 按钮的“触发”与“行为”解耦

这是你最关心的那一块。生成的 Monaco 页里，按钮**不写死自己要做什么**，只保存一个 `run` 回调；骨架只负责“被点击就调用 `run`”：

```js
// ===== 稳定骨架：不知道任何按钮要干嘛 =====
const ACTIONS = [];
function registerAction(a){ ACTIONS.push(a); }
function mountActions(){
  document.querySelector('.actions').innerHTML = '';
  ACTIONS.forEach(function(a){
    var b = document.createElement('button');
    b.innerHTML = a.label;
    b.addEventListener('click', function(){
      a.run({ btn:b, getCode:getCode, setCode:setCode, editor:ED }); // 只触发
    });
    document.querySelector('.actions').appendChild(b);
  });
}

// ===== 业务层：每个按钮只管自己的事 =====
registerAction({ id:'copy',     label:'Copy',     run:ctx => navigator.clipboard.writeText(ctx.getCode()) });
registerAction({ id:'download', label:'Download', run:ctx => downloadText(ctx.getCode()) });
registerAction({ id:'reset',    label:'Reset',    run:ctx => ctx.setCode(CODE) });
// Run 按钮只在 Python 页注册：
registerAction({ id:'run',      label:'▶ Run',    run:() => runCode() });
```

这正是 Python 里 `Button(text, command)` 的同一思路——**把行为作为参数传进去，骨架只负责调用**。

> **诚实说明**：这里用的是**命令模式 / 回调 + 列表**，`ACTIONS` 是数组而非 `{名字:行为}` 字典，所以严格说**不是注册表**（没有按名字查找）。它确实**解耦**了：`mountActions` 完全不知道按钮做什么。若要升级成真注册表，见 [场景 D](#场景-d-让别的语言也能-run-升级成运行器注册表)。

**为什么符合 OCP**：加一个按钮 = `registerAction({...})` 一行，`mountActions` 永远不用改。

---

## 4. 单例 / 惰性初始化（Singleton / Lazy Init）

Pyodide（约 10MB）只在**第一次点 Run** 时加载，且整页只加载一次——用一个缓存的 Promise 实现：

```js
let pyReady = null;
function ensurePy(){
  if (pyReady) return pyReady;           // 已加载 → 直接复用（单例）
  pyReady = loadScript(PYODIDE+'pyodide.js').then(()=>loadPyodide({indexURL:PYODIDE}));
  return pyReady;
}
```

ESM 模块本身也是天然单例：`config.js`、`posts.data.js` 无论被 import 多少次都是同一份。

---

## 5. 建造者 / 模板方法（Builder / Template Method）— `buildMonacoHtml`

`buildMonacoHtml` 像“流水线”一样，把页面**分部件拼装**；与语言相关的部件（输出面板、Pyodide 脚本、Run 按钮）按条件加入：

```js
const outputPanel = isPython ? `<div id="output">...</div>` : '';
const pyScript    = isPython ? `<script>...runCode()...<\/script>` : '';
return `<!DOCTYPE html> ... ${outputPanel} ... ${pyScript} ...`;
```

**为什么符合 OCP**：要给某类语言加一块新 UI，就多定义一个部件变量并拼进模板，主结构不变。

---

## 6. 装饰 / 组合（Decorator / Composition）— VitePress 主题

`docs/.vitepress/theme/index.js` **没有重写**默认主题，而是在它外面“包一层”：

```js
export default {
  extends: DefaultTheme,                       // 继承默认主题
  Layout(){
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(PostTags)           // 往插槽里塞“标签”组件
    })
  }
}
```

**为什么符合 OCP**：在默认主题**之上叠加**功能（文章顶部标签），完全不改 VitePress 源码。

---

## 7. 观察者（Observer）— 事件与响应式

- 编辑器内容变化 → 更新行数：`ED.onDidChangeModelContent(() => ...)`
- 按钮点击：`addEventListener('click', ...)`
- 标签页的 Vue `ref` / `computed`：选中的标签一变，文章列表自动重算

这些都是“注册监听者，状态变了自动通知”，加监听者不影响被观察对象。

---

## 8. 迭代器（Iterator）

`walkMd` 递归遍历文章目录；`createContentLoader('posts/**/*.md')` 统一吐出所有文章数据。调用方用 `for...of` / `forEach` 消费，不关心底层怎么遍历。

---

## 未来扩展：到底改哪一段 JS？

下面每个场景都遵循 OCP——**只新增，不改核心**。

### 场景 A：新增一门语言（Go / Rust / JavaScript）

改 **一处**：`scripts/generate-posts.mjs` 的 `LANG`。

```js
const LANG = {
  // ...已有...
  '.go': { language: 'go',         label: 'Go',         dir: 'go',  category: 'Go' },
  '.rs': { language: 'rust',       label: 'Rust',       dir: 'rust',category: 'Rust' },
  '.js': { language: 'javascript', label: 'JavaScript', dir: 'js',  category: 'JavaScript' },
}
```

如果想让它出现在侧边栏分类里，再到 `DIR_CATEGORY` 和 `CATEGORY_ORDER` 各加一条。**主循环、HTML 生成都不用动。**

### 场景 B：新增工具栏按钮（格式化 / 全屏 / 分享）

改 **一处**：`buildMonacoHtml` 里加一行 `registerAction`。

```js
// 全屏
registerAction({ id:'full', cls:'btn-reset', label:'⛶ Fullscreen',
  run: () => document.documentElement.requestFullscreen() });

// 分享当前（可能被编辑过的）代码：复制成 URL
registerAction({ id:'share', cls:'btn-dl', label:'Share',
  run: ctx => {
    const url = location.origin + location.pathname + '#code=' + encodeURIComponent(ctx.getCode());
    navigator.clipboard.writeText(url);
  }});
```

`mountActions` 会自动把它渲染出来。**骨架不动。**

### 场景 C：新增注释区块（错误处 / 遗忘处 / 延展 / 难度 / 来源…）

注释区块由一张**注册表 `SECTIONS`** 驱动，配一个**通用解析器 `parseSection`** + **通用渲染 `buildSectionBlocks`**。
所以新增一种区块 = 在 `SECTIONS` **加一行**，解析、边界判断、渲染逻辑**全都不用动**：

```js
const SECTIONS = [
  { names: '题目|题|problem|question',   title: '题目',   container: 'tip',     collapse: false },
  { names: '错误|错误处|踩坑|mistake|bug', title: '错误处', container: 'warning', collapse: true },
  { names: '遗忘|遗忘处|易忘|forgot',     title: '遗忘处', container: 'danger', collapse: true },
  { names: '延展|拓展|相关|related',       title: '延展',   container: 'info',    collapse: false },

  // 👇 想加“复杂度”？只要加这一行：
  { names: '复杂度|complexity', title: '复杂度', container: 'info', collapse: false },
]
```

- `names`：在注释里能触发它的关键词（`|` 分隔，大小写不限）
- `title`：渲染出来的标题
- `container`：颜色样式 `tip`(绿) / `warning`(黄) / `danger`(红) / `info`(灰)
- `collapse`：`true` = 渲染成**默认收起**的折叠块（适合“错误处/遗忘处”这种先自测、想看时再点开）；`false` = 普通常开提示框

然后源文件注释里直接写就行（单行或多行都支持）：

```python
# 题目: 接雨水，求能接多少水
# 错误处: 弹栈后忘了判空导致越界
# 遗忘处: width = i - left - 1 的 -1 容易漏
# 延展: 柱状图最大矩形、每日温度、下一个更大元素
# 复杂度: 时间 O(n)，空间 O(n)
```

**为什么符合 OCP**：`parseSection`/`buildSectionBlocks`/主循环都不知道有多少种区块——它们只是遍历 `SECTIONS`。
加区块只“新增配置”，不“修改逻辑”。标签解析（`parseTagsFromComments`）也复用了同一个 `parseSection`，零重复。

> 边界处理：每个区块从它的指令行开始，收集后续注释，直到遇到**另一条指令 / 空注释行 / 分隔线(`====`) / 非注释行**为止，所以多个区块和代码横幅不会互相串味。

### 场景 D：让别的语言也能 Run（升级成“运行器注册表”）

现在“能不能运行”是靠 `isPython` 特判的。要支持多语言运行，把它换成一张**真注册表**（`语言 → 运行器`），这同时把命令列表升级成 name→behavior 映射：

```js
// 运行器注册表：语言 → 异步运行函数
const RUNNERS = {
  python: async (code, out) => { const py = await ensurePy();
    py.setStdout({batched:out}); py.setStderr({batched:out}); await py.runPythonAsync(code); },
  javascript: async (code, out) => {            // 新增 JS 运行器：只加这一条
    const log = console.log; console.log = (...a)=>out(a.join(' ')+'\n');
    try { eval(code); } finally { console.log = log; }
  },
}

// Run 按钮变成通用的：从注册表按语言查运行器
const runner = RUNNERS['${lang}'];
if (runner) registerAction({ id:'run', cls:'btn-run', label:'▶ Run',
  run: () => runner(getCode(), appendOut) });
```

**为什么符合 OCP**：以后支持一门新语言运行，只往 `RUNNERS` 里**加一条**，Run 按钮的挂载逻辑、按钮骨架都不动。

### 场景 E：调整分类与排序

改 `scripts/generate-posts.mjs` 顶部的两张表即可：

```js
const DIR_CATEGORY = { python:'Python', java:'Java', c:'C', cpp:'C++' }
const CATEGORY_ORDER = ['Python', 'Java', 'C', 'C++', '随笔']   // 调顺序就改这里
```

---

## 一句话总结

本项目把“会变的东西”都做成了**配置表（LANG / RUNNERS）或回调（ACTIONS）**，核心流程只负责“查表 / 调用”。
所以绝大多数扩展都是**加一行配置或注册一个回调**，而不是去改已经写好、已经验证过的核心逻辑——这就是开闭原则在这个项目里的落地方式。
