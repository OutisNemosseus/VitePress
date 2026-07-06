UnionfindDIct2.py
class unionFind:
    def __init__(self):
            self.parent = {}
            self.rank = {}
            self.count = 0
    def add(self,x):
            if x not in parent[x]:
                self.parent[x] = x
                self.rank[x]=0
                self.count += 1 
            
    
    def find(self,x):
            if self.parent[x] == x:
                    return x
            else :
                self.parent[x] = self.find(self.parent[x])
            return self.parent[x]

    def union(self,x,y):
            rx = self.find(x)
            ry = self.find(y)
            if rx == ry:
                   return
            if self.rank[rx] < self.rank[ry]:
                   rx,ry = ry, rx
            self.parent[ry] = rx
            if self.rank[rx] == self.rank[ry]:
                   self.rank[rx] +=1 
            self.count -=1 
            
                            