#Dijkstra
while heap:
    #if the distance is not the smallest, skip
    if dist[v]<                          # ❌ 多个问题：
                                         #    (1) 循环开头缺 pop：应先 d, u = heappop(heap)
                                         #    (2) 判断变量错了：skip 判断的是弹出的 d 和 u，不是 v
                                         #        应为 if d > dist[u]: continue
                                         #    (3) 语句没写完
    for v,w in graph[u]:
        if dist[v] < dist[u] + w:        # ❌ 不等号方向反了（最严重）
                                         #    Dijkstra 找更短路，应为 if dist[u] + w < dist[v]:
            dist [v] = dist[u] + w
        #update new distance into heap
        heap(v).append(dist)             # ❌ 多个问题：
                                         #    (1) 缩进错：这行应在上面 if 成立的分支里（只有更短才入堆）
                                         #    (2) heap 是列表不是函数，不能 heap(v)
                                         #    (3) 堆不用 .append，要用 heappush
                                         #    (4) 入堆的是元组 (新距离, 邻居)，距离在前；不是整个 dist
                                         #    正确：heappush(heap, (dist[v], v))

# ❌ 循环外还缺：
#    from heapq import heappush, heappop        （缺 import）
#    dist = [inf] * n; dist[start] = 0          （dist 初始化：起点 0，其余 inf）
#    heap = [(0, start)]                         （堆放入起点）