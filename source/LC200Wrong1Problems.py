# 题目: LC200
# tags: 算法, 单调栈, 接雨水, 双指针   # 问题0: tag错了。LC200是Number of Islands，用的是Union-Find/DFS/BFS，跟单调栈、接雨水、双指针无关
class unionFind:                        # 问题1: 命名不一致。这里叫unionFind，后面实例化用的是UnionFind，对不上
    def __init__ :                      # 问题2: 语法错。缺(self, ...)和括号，应为 def __init__(self, n):
            parent[x] = x for x in nums  # 问题3: 语法错。这不是合法的列表/字典推导写法；parent未定义为self.parent；nums从哪来的没定义
                                         #        应类似 self.parent = list(range(n)) ，同时rank也没初始化(union里用到了self.rank)
    
    def find(self,x):
            if self.parent[x] == x:
             return                       # 问题4: 逻辑错。find应该返回根节点，这里return了None；应为 return x
            else :
             self.parent[x] = find(parent[x])  # 问题5: 三处错。①漏self.前缀，应为self.find；②参数应是self.parent[x]；③这行没return，路径压缩后没把根返回上去
        
    def union(self,x,y):
        rx = find(x)                      # 问题6: 漏self.，应为 self.find(x)
        ry = find(y)                      #        同上
        if rank[rx] < rank[ry] :          # 问题7: 漏self.，应为 self.rank；且rank从没初始化过
                rx, ry = ry, rx
        parent[ry] = rx                   # 问题8: 漏self.，应为 self.parent[ry] = rx
                                          # 问题9: 逻辑缺失。按rank合并后，当两根rank相等时需要给新根rank+1；否则rank优化失效
                                          # 问题10: 缺少 rx == ry 时直接return的判断(本题网格不会成环，但这是标准写法)

# transfer Grid to one dimension, give land ID, then instantiate class
rows = length.grid                        # 问题11: 语法错。应为 len(grid)
columns = length.grid[0]                  # 问题12: 语法错。应为 len(grid[0])；另需处理grid为空的边界

# we first need to make a diction anry
landID = {}
for row in rows:                          # 问题13: 逻辑错。rows是个整数，不能直接迭代；应为 for row in range(rows)
        for column in columns:            #        同上，应为 for column in range(columns)
                if grid == 1:             # 问题14: 逻辑错。grid是二维数组，应为 grid[row][column] == 1
                        landID(row,column)= row + column   # 问题15: 多处错。①字典赋值用[]不是()；②key应为(row,column)或一维索引；③值 row+column 会重复冲突，正确的一维编号是 row*columns + column
                        #give  each land area a number:

uf = UnionFind(length.landID)             # 问题16: 命名对不上(UnionFind vs unionFind)；length.landID语法错；参数应是格子总数 rows*columns 而非陆地数(否则一维索引会越界)

# now we union right and bottom of land area
landID = {}                               # 问题17: 逻辑错。这里又把landID清空重建了，上面建好的全丢了
for row in rows:                          # 问题18: 同问题13，rows不可迭代
        for column in columns:
                if grid == 1:             # 问题19: 同问题14
                        if grid(row+1,column) ==1 :   # 问题20: 多处错。①grid()应为grid[][]；②row+1越界(缺 row+1 < rows 判断)
                                union(landID(this),landID((row+1)*column + column))  # 问题21: 多处错。①union漏uf.前缀；②this未定义；③landID用()调用错误；④(row+1)*column应为(row+1)*columns
                        if grid(row,column+1) == 1:   # 问题22: 同上，column+1缺越界判断，grid索引错
                                union(landID(this),landID(this)+1)  # 问题23: 逻辑错。相邻右格的一维ID不是"当前ID+1"这么写(思路对但表达全错)，且缺uf.前缀、this未定义
# counter union number
return length(landID)                     # 问题24: 逻辑错。答案是连通分量个数，不是landID长度；应统计不同根的数量(遍历所有陆地格，count其中 find(x)==x 的个数)。另外return在函数外(顶层)也是语法错

# 总体缺失: 整段代码没有包在一个函数(如 def numIslands(self, grid))里