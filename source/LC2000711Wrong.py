#LC200

class unionFind:
        def __init__(self):
                self.parent = {}
                self.rank = {}

        def  find(self,x):
                if x not in self.parent:
                        self.parent[x] = x
                        self.rank[x] = 0
                        return x
                else:
                        if self.parent[x] == x:
                                return x
                        else:
                                self.parent[x] = self.find(self.parent[x])
                                return self.parent[x]

        def union(self,x ,y):
                rx = self.find(x)
                ry = self.find(y)
                if rx == ry:
                        return
                else:
                        if self.rank[rx] < self.rank[ry]:
                                rx,ry = ry, rx
                        self.parent[ry] = rx
                        if self.rank[rx] == self.rank[ry]:
                                self.rank[rx] += 1
class Solution:
    def numIslands(self, grid):

        roots = set()
        uf = unionFind()
        rows = len(grid)
        columns = len(grid[0])
        # [遗漏] 缺 grid 为空的边界处理：if not grid: return 0

        for row in range(rows):
            for column in range(columns):
                if grid[row, column] == 1:
                    # [错误1] grid[row, column] 是 numpy 语法；list 必须 grid[row][column]
                    # [错误2] 网格是字符 '1'，不是整数 1；应 == '1'

                    if grid[row+1, column] == 1：
                        # [错误3] 全角冒号 ：，语法错误，应半角 :
                        # [错误4] row+1 越界：row 到最后一行时 grid[row+1] 出界；需 row+1 < rows
                        # [错误1/2 同上] 索引和 '1' 比较问题
                        uf.union(grid[row, column], grid[row+1, column])
                        # [错误5-致命] union 传的是格子“值”(全是 '1')，不是唯一坐标 id；
                        #   所有陆地会并成同一个节点。应传 row*columns+column 之类的 id

                    if grid[row, column+1] == 1:
                        # [错误4 同上] column+1 越界，需 column+1 < columns
                        # [错误1/2/5 同上]
                        uf.union(grid[row, column], grid[row, column+1])

                    # [遗漏] 孤立陆地（四周都是水）也要 uf.find(id) 一次，
                    #        否则它从没进过 parent，不会被计数

        for x in range(len(uf.parent):
            # [错误6-语法] 缺右括号 )
            # [错误7] range(len(uf.parent)) 生成 0,1,2...，与坐标 id 不对应（当键不连续时全错）
            roots = parent[x]
            # [错误8] parent 未定义，应 uf.parent[x]
            # [错误9-致命] 用 = 覆盖，不是收集；应 roots.add(uf.find(x))
        return len(roots)













































                                

