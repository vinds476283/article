柯西不等式说实话用得频率小得可怜, 但实力确实足够强大, 虽然刚用是感觉用不上, 但用多了之后发现很多常规题用柯西比均值快得多. 我最初也是不喜欢用不等式求最值的, 更倾向于用导数, 因为确实注意不到, 导数都不需要思考, 但随着与这些不等式技巧的磨合, 渐渐形成一定的条件反射, 也发现不等式在很多情况下要更舒适一些, 尤其是 2026 年全国一卷第 18 题的圆锥曲线中偷偷藏了个基本不等式, 其实就该意识到不等式求最值的强大作用了. 而其中柯西不等式是重要的不等式之一. 

柯西不等式表述为: 
对于任意的实数 $a_1,a_2,\cdots,a_n,b_1,b_2,\cdots,b_n$, 总有
$$\left( \sum_{i=1}^na_ib_i \right)^2\le\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2.$$
当且仅当 $\dfrac{a_1}{b_1}=\dfrac{a_2}{b_2}=\cdots=\dfrac{a_n}{b_n}$ 或 $b_1=b_2=\cdots=b_n=0$ 时取得等号. 

对于二元的情况更为常用:
对于任意的实数 $a_1,a_2,b_1,b_2$, 总有
$$\left( a_1b_1+a_2b_2 \right)^2\le\left( a_1^2+a_2^2 \right)\left( b_1^2+b_2^2 \right).$$
当且仅当 $\dfrac{a_1}{b_1}=\dfrac{a_2}{b_2}$ 或 $b_1=b_2=0$ 时取得等号. 

事实上, 准确来说取等条件是存在实数 $\lambda$, 使得对于任意 $1$ 到 $n$ 上的正整数 $i$, 均有 $a_i=\lambda b_i$. 

至于这个全为 $0$ 的情况, 自然是需要讨论的, 这个自行讨论就行了, 非常简单, 我下面也不再说全为 $0$ 的情况了. 

## 用处
柯西不等式的一大用处就是快速调节系数, 因为柯西不等式的本质就是将两组变量分离, 看到例题
>已知 $a^2+b^2=1$, 求 $3a+4b$ 的最大值. 

柯西不等式直接放缩 
$$3a+4b\le\sqrt{\left( 3^2+4^2 \right)\left( a^2+b^2 \right)}=5.$$
验证取等条件即可. 
当然, 这道题更容易想到的就是三角换元, 甚至能思考几何意义, 但这只是一个例题, 所以还是以简单为好. 

----
柯西不等式的用处确实多, 可惜它不在考纲内, 因此不能直接用. 但可以通过证明柯西不等式或者用证明不等式的方法直接求就可以解决这样的问题. 一般来说我们倾向于使用二次函数去证明, 因为这个足够简单. 但事实上确实会有人因一段时间不用就忘记这个二次函数, 相比之下向量的证法我觉得看一遍就能记足够久, 因此也顺带提供. 

## 二次函数
令二次函数 $\displaystyle f\left( t \right)=\sum_{i=1}^n\left( a_it+b_i \right)^2=\left( \sum_{i=1}^na_i^2 \right)t^2+\left( 2\sum_{i=1}^n a_ib_i \right)t+\left( \sum_{i=1}^nb_i^2 \right)\ge0$ , 则有 $\displaystyle \Delta=\left( 2\sum_{i=1}^n a_ib_i \right)^2-4\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2=4\left( \left( \sum_{i=1}^na_ib_i \right)^2-\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2 \right)\le0$, 即得柯西不等式. 等号当且仅当二次函数取得 $0$, 即 $-t=\dfrac{b_1}{a_1}=\dfrac{b_2}{a_2}=\cdots=\dfrac{b_n}{a_n}$ 时取得. 

### 例题
>已知 $a^2+b^2=1$, 求 $3a+4b$ 的最大值. 

令
$$\begin{align*}f\left( t \right)&=\left(  3t+a \right)^2+\left(  4t+b \right)^2\\&=25t^2+2\left( 3a+4b \right)t+\left( a^2+b^2 \right)\\&=25t^2+2\left( 3a+4b \right)t+1.\end{align*}$$ 
则 $\Delta=4\left( 3a+4b \right)^2-4\times25=4\left( \left( 3a+4b \right)^2 -25\right)\le0$, 即得. 等号当且仅当二次函数取得 $0$, 即 $-t=\dfrac a3=\dfrac b4$ 时取得. 

## 向量
令向量 $\vec a=\left( a_1,a_2,\cdots,a_n \right),~\vec b=\left( b_1,b_2,\cdots,b_n \right)$, 则
$1\ge\cos^2\left\langle \vec a,\vec b \right\rangle=\left( \dfrac{\vec a\cdot\vec b}{\left| \vec a \right|\left| \vec b \right|} \right)^2=\dfrac{\displaystyle\left( \sum_{i=1}^na_ib_i \right)^2}{\displaystyle\sum_{i=1}^na_i^2\sum_{i=1}^nb_i^2}$,
即证. 等号当且仅当两条项向量共线, 即 $\dfrac{a_1}{b_1}=\dfrac{a_2}{b_2}=\cdots=\dfrac{a_n}{b_n}$ 时取得

### 例题
>已知 $a^2+b^2=1$, 求 $3a+4b$ 的最大值. 

令 $\vec a=\left( 3,4 \right),~\vec b=\left( a,b \right)$, 则 $1\ge\cos\left\langle \vec a,\vec b \right\rangle=\dfrac{3a+4b}{\sqrt{a^2+b^2}\sqrt{3^2+4^2}}=\dfrac{3a+4b}5$, 即得. 等号当且仅当两条项向量共线, 即 $\dfrac{3}{4}=\dfrac{a}{b}$ 时取得

但其实要求额外注意的就是, 高维向量确实在选择性必修三中证明样本相关系数 $r$ 的取值范围时用到了, 但并非考纲内的内容, 所以很有可能也是用不了的. 

而另外一点, 既然证明样本相关系数 $r$ 的取值范围时用到了高维向量,于是有同学可能想着样本相关系数出发是不是也能证明柯西不等式? 看到
$$1\ge r^2=\dfrac{\displaystyle\left( \sum_{i=1}^n\left( x_i-\overline x \right)\left( y_i-\overline y \right) \right)^2}{\displaystyle\sum_{i=1}^n\left( x_i-\overline x \right)^2\sum_{i=1}^n\left( y_i-\overline y \right)^2},$$
寻思只需要令 $a_i=x_i-\overline x,~b_i=y_i-\overline y$ 即可, 实际上你无法控制这个值取到任意实数, 例如希望取 $a_1=3,~a_2=4$, 发现找不到 $x_1,x_2$, 列方程组无解. 事实上如果 $\sum a_i=0$ 才有解, 而且解无穷多, 否则就无解, 这个可以用线性代数的知识去证, 这里不介绍,因为不重要. 所以我们没有办法通过样本相关系数取证明柯西不等式. 

## 期望
这个方法正常人应该不会去用, 因为这个更倾向于观赏性. 当时别人分享给我这个解法称其"注意力惊人", 而我一看, 本质就是柯西不等式, 就是披了个期望的外衣罢, 这里一并分享了. 

这个方法我不愿意写出一个普遍的情况, 一方面正如我刚刚说的, 正常不会有人没事有事用这种方法; 另一方面, 若非要写出普遍情况, 这个形式太过复杂, 还不如没有, 直接看例题反而更清晰. 

### 例题
>1. 已知 $a^2+b^2=1$, 求 $3a+4b$ 的最大值. 

显然 $ab\ne0$, 这个自己讨论即可, 下面我也不写了. 于是可以设随机变量 $X$ 的分布满足 $P\left( X=\dfrac3a \right)=a^2,~P\left( X=\dfrac4b \right)=b^2$, 因为 $a^2+b^2=1$, 所以这个分布恰好成立, 如果不是那需要自己另外手动调节系数. 于是我们计算方差
$$\begin{align*}0\le D\left( X \right)&=E\left( X^2 \right)-E^2\left( X \right)\\&=\left( a^2\dfrac9{a^2}+b^2\dfrac{16}{b^2} \right)-\left( a^2\dfrac3a+b^2\dfrac4b \right)^2\\&=25-\left( 3a+4b \right)^2.\end{align*}$$
直接利用方差恒大于等于 $0$ 就能得到结果. 当且仅当随机变量 $X$ 为常数, 即 $\dfrac3a=\dfrac4b$ 时取得等号. 

>2. 已知 $a^2+b^2=2$, 求 $3a+4b$ 的最大值. 

设随机变量 $X$ 的分布满足 $P\left( X=\dfrac6a \right)=\dfrac{a^2}2,~P\left( X=\dfrac8b \right)=\dfrac{b^2}2$, 这就是刚刚说的"手动调节系数". 于是我们计算方差
$$\begin{align*}0\le D\left( X \right)&=E\left( X^2 \right)-E^2\left( X \right)\\&=\left( \dfrac{a^2}2\dfrac{36}{a^2}+\dfrac{b^2}2\dfrac{64}{b^2} \right)-\left( \dfrac{a^2}2\dfrac6a+\dfrac{b^2}2\dfrac8b \right)^2\\&=50-\left( 3a+4b \right)^2.\end{align*}$$
当且仅当随机变量 $X$ 为常数, 即 $\dfrac6a=\dfrac8b$ 时取得等号. 

>3. 已知 $3a+4b=5$, 求 $a^2+b^2$ 的最小值. 

设随机变量 $X$ 的分布满足 $P\left( X=\dfrac3a \right)=\dfrac{a^2}{a^2+b^2},~P\left( X=\dfrac4b \right)=\dfrac{b^2}{a^2+b^2}$. 于是我们计算方差
$$\begin{align*}0\le D\left( X \right)&=E\left( X^2 \right)-E^2\left( X \right)\\&=\left( \dfrac{a^2}{a^2+b^2}\dfrac9{a^2}+\dfrac{b^2}{a^2+b^2}\dfrac{16}{b^2} \right)-\left( \dfrac{a^2}{a^2+b^2}\dfrac3a+\dfrac{b^2}{a^2+b^2}\dfrac4b \right)^2\\&=\dfrac{25}{a^2+b^2}-\left( \dfrac{3a+4b}{a^2+b^2} \right)^2\\&=\dfrac{25\left( a^2+b^2 \right)-25}{\left( a^2+b^2 \right)^2},\end{align*}$$
分母肯定大于 $0$, 只需要保证分子 $25\left( a^2+b^2 \right)-25\ge0$, 立刻得到答案. 
当且仅当随机变量 $X$ 为常数, 即 $\dfrac3a=\dfrac4b$ 时取得等号. 

习题: 
1. 已知 $x^2+2y^2=1$, 求 $5x+12y$ 的最大值. 
2. 已知 $a^2+b^2+c^2=1$, 求 $2a+4b+8c$ 的最大值. 
3. 已知 $6x+8y=10$, 求 $3x^2+y^2$ 的最小值. 
4. 已知 $3a+7b+5c=10$, 求 $a^2+b^2+c^2$ 的最小值. 

习题答案放在了[[(2) 习题答案#(3)° 柯西不等式 (C-S不等式)]]. 