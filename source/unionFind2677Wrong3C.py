class UnionFind:
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def add(self, x):
        if x in self.parent:  # 原来: if x in parent —— 少了 self.
            return
        self.parent[x] = x    # 原来: parent[x] = x —— 少了 self.
        self.rank[x] = 0      # 原来: rank[x] = 0 —— 少了 self.

    def find(self, x):
        if self.parent[x] == x:  # 原来: if parent[x] == x —— 少了 self.
            return x             # 原来: return —— 根节点应返回 x，不是空
        self.parent[x] = self.find(self.parent[x])
        return self.parent[x]    # 原来: return parent[x] —— 少了 self.

    def union(self, x, y):
        rx = self.find(x)  # 原来: rx = find(x) —— 少了 self.
        ry = self.find(y)  # 原来: ry = find(y) —— 少了 self.
        if rx == ry:
            return
        if self.rank[rx] < self.rank[ry]:  # 原来: if rank[rx] < rank[ry] —— 少了 self.
            rx, ry = ry, rx
        self.parent[ry] = rx  # 原来: parent[ry] = rx —— 少了 self.
        if self.rank[rx] == self.rank[ry]:  # 原来: if rank[rx] = rank[ry] —— = 应为 ==，且少 self.
            self.rank[rx] += 1  # 原来: rank[rx] += 1 —— 少了 self.


class Solution:
    def numIslands(self, grid):  # 原来: def numIslands(self,grid)： —— 全角冒号 ： 应为半角 :
        rows = len(grid)
        columns = len(grid[0])
        uf = UnionFind()  # 原来: uf = unionFind() —— 类名大小写不一致

        # add
        for row in range(rows):
            for col in range(columns):
                if grid[row][col] == "1":  # 原来: if grid(row,column) == 1 —— 圆括号应为方括号下标; column 应为 col; 值是字符 "1"
                    uf.add((row, col))      # 原来: landID(row,column)=（row,column）; uf.add(row,column)=（row,column） —— 无效赋值, 不需要 landID, add 只传一个元组

        # union
        for row in range(rows):
            for col in range(columns):
                if grid[row][col] == "1":  # 原来: if grid(row,column) == 1 —— 同上下标错误
                    if col + 1 < columns and grid[row][col+1] == "1":  # 原来: if grid(row,column+1)==1 —— 缺边界检查, 下标错误
                        uf.union((row, col), (row, col+1))  # 原来: uf.union(landID(row,column),landID(row,column+1)) —— 不需要 landID
                    if row + 1 < rows and grid[row+1][col] == "1":  # 原来: if landID(row+1,column)==1 —— 应判断 grid 不是 landID; 缺边界检查
                        uf.union((row, col), (row+1, col))  # 原来: uf.union(landID(row,column),landID(row+1,column)) —— 不需要 landID

        # count
        roots = set()
        for row in range(rows):
            for col in range(columns):
                if grid[row][col] == "1":
                    roots.add(uf.find((row, col)))
        return len(roots)