# 题目: LC200 岛屿数量 —— 用并查集统计连通分量个数
# tags: 算法, 并查集, UnionFind, 网格问题
# 错误处: __init__ 缺少 self 和参数列表，是语法错误
# 错误处: self.parent[x] = x for x in ... 是不完整的推导式，且 self.parent 本身没先初始化成容器
# 错误处: find/union 方法都漏了 self 参数，形参名和实际用的变量名对不上
# 错误处: find 的 base case 只 return 空值，没有 return x，导致 find 永远返回 None
# 错误处: 递归压缩路径那行调用的是裸露的 find(parent[x])，没写 self.，会直接 NameError
# 错误处: union 里访问 parent/self.parent 前后不一致，多处漏 self.
# 遗忘处: union 中 root_x == root_y 时的返回值语义反了——同根应该表示"已经连通/无需合并"，
#          通常返回 False 或直接 return，而不是 return True
# 遗忘处: union 分支缺 return，隐式返回 None，导致调用方无法判断是否真正发生了合并
# 延展: 类似题——LC130 被围绕的区域、LC130/1319 连通分量数、LC684/685 冗余连接、LC1101 得到子女同意的最晚时间
# ============================================================
# 稳定层：通用并查集骨架，放在具体题目 class 外面（和网格坐标映射解耦）
# ==================================

class UnionFind:
    def __init__(self, n):
        # 原代码: self.parent[x] = x for x in  ← 语法不完整，且没有先给 self.parent 赋容器
        self.parent = [x for x in range(n)]   # 用列表推导式正确初始化
        self.rank = [0] * n                   # 原代码完全没有 rank/size，合并时容易退化成链表

    def find(self, x):
        # 原代码: def find(children):        ← 漏 self，参数名 children 也没用上
        if self.parent[x] == x:
            return x                          # 原代码这里只 return（空），导致外部拿到 None
        self.parent[x] = self.find(self.parent[x])  # 原代码写的是 find(parent[x])，两处都漏 self.
        return self.parent[x]                 # 原代码整个函数没有最终 return，永远返回 None

    def union(self, x, y):
        # 原代码: def union(x,y):             ← 漏 self
        root_x = self.find(x)                 # 原代码写 find(x)，漏 self.
        root_y = self.find(y)                 # 原代码写 find(y)，漏 self.
        if root_x == root_y:
            return False                      # 原代码写 return True，语义反了：
                                               # 同根说明已经连通，不需要再合并
        # 按 rank 合并，避免树退化成链表（原代码完全没有这一层）
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_x] = root_y      # 原代码这里漏 self.
            self.rank[root_y] += 1
        return True                           # 原代码没有这个分支的 return，无法判断是否真正合并成功