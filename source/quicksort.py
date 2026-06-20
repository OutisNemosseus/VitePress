def quicksort(arr):
    """经典快速排序：选基准、分区、递归。"""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)


if __name__ == "__main__":
    print(quicksort([3, 6, 1, 8, 2, 9, 4]))
