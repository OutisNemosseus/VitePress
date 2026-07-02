# 题目: LC200
# tags: 算法, 单调栈, 接雨水, 双指针
class unionFind:
    def __init__ :
            self.parent[x] = x for x in 
    
    def find(children):
            if self.parent[x] == x:
             return
            else :
             self.parent[x] = find(parent[x])
        
    def union(x,y):
            root_x = find(x)
            root_y = find(y)
            if root_x == root_y :
                return True
            else:
                 parent[root_x] = root_y
        
