class Unionfind:
    def __init__(self):
        self.parent = {}
        self.rank = {}

    def add(self,x):
        if x  in parent:
            return
        parent[x] = x
        rank[x] = 0
        
         
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
        #Boundary
        rows = len(grid)
        columns = len(grid[0])
        #landID

        landID = {}

        #instantiate
        uf = unionFind()

        for row in range(rows):
            for col in range(columns):
                if grid(row,column) == 1 :
                    landID(row,column)= （row,column）
                    uf.add(row,column) = （row,column）
            


        #Union
        for row in range(rows):
            for col in range(columns):
                if grid(row,column) == 1:
                    if grid(row,column+1)==1:
                        uf.union(landID(row,column),landID(row,column+1))

                    if landID(row+1,column)==1:
                        uf.union(landID(row,column),landID(row+1,column))



        #COunt
        for row in range(rows):
            for col in range(columns):
































