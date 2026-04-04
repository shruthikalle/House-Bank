import random

def test():
    # geneate a random number between 1 and 2
    num = random.randint(1, 2)
    a = 100

    n = 1000

    for i in range(n):
        num = random.randint(1, 2)
        a/=2
        if num == 1:
            
            a += a*(3/5)
        else:

            a += a*(2/5)
    print(a)
test()