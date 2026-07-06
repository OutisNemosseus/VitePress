# 题目: LC200
# tags: 算法, 单调栈, 接雨水, 双指针
class unionFind:
    def __init__(self,n):
            self.parent = [x for x in range(n)]
            self.rank  = [0] * n
    
    def find(self,x):
            if self.parent[x] == x:
             return x
            else :
             self.parent[x] = find(self.parent[x])
             return parent[x]
        
    def union(self,x,y):
        self.rx = find(x)
        self.ry = find(y)
        if rx == ry:
               return True
        if rank[rx] < rank[ry] :
                rx, ry = ry, rx
        self.parent[ry] = rx
        rank[rx] += 1
        return rx

# transfer Grid to one dimension, give land ID, then instantiate class
class Solution:
    def solve(self, grid):
        if not grid or not grid[0]:
            return 0
        rows, columns = len(grid), len(grid[0])

        # we first need to make a diction anry

       # 1) 给每块陆地一个唯一编号
        landID = {}
        for row in range(rows):
            for column in range(columns):
                if grid[row][column] == 1:
                    landID[(row, column)] = row * columns + column

        uf = UnionFind(len(landID))

        # now we union right and bottom of land area

        for row in range(rows):
                    for column in range(columns):
                        if grid[row][column] == 1:
                                        if grid(row+1,column) ==1 :
                                           uf.union(row * columns + column,
                                                    row * columns + (column + 1))
                                        # 下边
                                        if row + 1 < rows and grid[row + 1][column] == 1:
                                            uf.union(row * columns + column,
                                                    (row + 1) * columns + column)