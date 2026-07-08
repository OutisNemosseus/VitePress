class Unionfind:
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def add(self,grid):
        if grid is in parent:
            return
        else:
            self.parent[grid] = grid
            self.rank[grid] += 1 
         
    def find(self,x):
        if parent[x] == x:
            return
        else:
            self.parent[x] = self.find(self.parent[x])
            return parent[x]
    
    def union(self,x,y):
        rx = find(x)
        ry = find(y)
        if rx == ry:
            return
        
        if rank[rx] < rank[ry]:
             rx,ry = ry, rx
        parent[ry ] = rx
        if rank[rx] = rank[ry]:
            rank[rx] += 1 
class Solution:
    def numIslands(self,grid)：

    






























