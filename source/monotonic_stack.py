# 题目: 接雨水 —— 给定每个柱子的高度，求下雨后能接住多少单位的水。
# tags: 算法, 单调栈, 接雨水, 双指针
# 错误处: 弹栈后忘了判断栈是否为空，导致 stack[-1] 越界。
# 遗忘处: width = i - left - 1 里的 -1 容易漏掉。
# 延展: 类似题——柱状图中最大的矩形、每日温度、下一个更大元素。
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
