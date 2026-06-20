// 题目: 用 for 循环打印三次问候语，熟悉 printf 与计数循环。
// tags: 入门, 循环
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 3; i++) {
        printf("Hello, TLPI! (%d)\n", i);
    }
    return 0;
}
