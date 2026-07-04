# 题目: LC200
# tags: 算法, 单调栈, 接雨水, 双指针
class unionFind:
    def __init__ :
            parent[x] = x for x in nums
    
    def find(self,x):
            if self.parent[x] == x:
             return
            else :
             self.parent[x] = find(parent[x])
        
    def union(self,x,y):
        rx = find(x)
        ry = find(y)
        if rank[rx] < rank[ry] :
                rx, ry = ry, rx
        parent[ry] = rx

# transfer Grid to one dimension, give land ID, then instantiate class
rows = length.grid
columns = length.grid[0]

# we first need to make a diction anry

landID = {}
for row in rows:
        for column in columns:
                if grid == 1:
                        landID(row,column)= row + column
                        #give  each land area a number:

uf = UnionFind(length.landID)

# now we union right and bottom of land area

landID = {}
for row in rows:
        for column in columns:
                if grid == 1:
                        if grid(row+1,column) ==1 :
                                union(landID(this),landID((row+1)*column + column))
                        if grid(row,column+1) == 1:
                                union(landID(this),landID(this)+1)
# counter union number
return length(landID)
