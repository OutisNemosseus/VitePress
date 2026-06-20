def checkout(items, discount):
    total = sum(items)
    return discount(total)


full_price = lambda t: t
half_off = lambda t: t * 0.5

print(checkout([10, 20, 30], half_off))  # 30.0
