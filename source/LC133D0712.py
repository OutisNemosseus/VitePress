def dfs():
        #termination condition
        clone = {}
        if cur is in clone:
                return cur





        #build copy
        copy = Node(cur.value)
        #push copy into clone dict
        clone[cur] = copy
        #copy neighbours of current pointer

        for nei in  cur.neighbours:
              copy.neighbors.append(  dfs(nei))
              