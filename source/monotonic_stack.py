# ============================================================
# 稳定层：通用单调栈骨架，放在 class 外面（和具体题目解耦）
# ============================================================
def monotonic_stack(arr, should_pop, on_pop):
    stack = []
    for i in range(len(arr)):
        while stack and should_pop(arr[stack[-1]], arr[i]):
            j = stack.pop()
            on_pop(j, i, stack)         # 结算回调
        stack.append(i)
    return stack


class Solution:
    def trap(self, height):
        total = 0

        def on_pop(j, i, stack):
            nonlocal total
            if not stack:               # 弹出后栈空 → 接不住水
                return
            left = stack[-1]            # 新栈顶 = 左墙
            width = i - left - 1
            bounded_height = min(height[left], height[i]) - height[j]
            total += width * bounded_height

        monotonic_stack(                # ← 现在直接调用，因为它在 class 外
            height,
            should_pop=lambda top, cur: top < cur,
            on_pop=on_pop,
        )
        return total
