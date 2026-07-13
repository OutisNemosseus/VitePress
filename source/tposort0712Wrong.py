
from collections import heapq
#indegree

while heap:
    u = heapq.heappop(heap)
    #u加入order
    order.append(u)
    for v in graph[u]:
        #入度减1
        indegrees[v] -= 1 
        #如果入度为0，应该加入heap
        if indegrees[v] == 0:
            heapq.push(heap,v)



