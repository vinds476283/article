琴生不等式表述为: 
>函数 $f\left( x \right)$ 在区间 $\left( a,b \right)$ 上是凸函数, 即在区间上恒有 $f''\left( x \right)\ge0$, 则对于任意实数 $a_1,~a_2,~\cdots,~a_n\in\left( a,b \right)$, 有
>$$\dfrac1n\sum_{i=1}^nf\left( x_i \right)\ge f\left( \dfrac1n\sum_{i=1}^nx_i \right).$$
>对于任意非负实数 $\alpha_1,~\alpha_2,~\cdots,~\alpha_n$ 满足 $\displaystyle\sum_{i=1}^n\alpha_i=1$, 有
>$$\sum_{i=1}^n\alpha_if\left( x_i \right)\ge f\left( \sum_{i=1}^n\alpha_ix_i \right).$$

这个取等条件比较复杂, 也很难解释清楚, 但我们可以看到琴生不等式的一个强命题, 这个取等条件就很好理解了: 

### 切线不等式
>存在一次函数 $L\left( x \right)=kx+b$, 函数 $f\left( x \right)$ 在区间 $\left( a,b \right)$ 上满足 $f\left( x\right)\ge L\left( x \right)$, 则对于任意实数 $a_1,~a_2,~\cdots,~a_n\in\left( a,b \right)$, 有
>$$\dfrac1n\sum_{i=1}^nf\left( x_i \right)\ge\dfrac1n\sum_{i=1}^nL\left( x_i \right).$$

这是一个显而易见的事实, 但我们进一步看到: 
$$\dfrac1n\sum_{i=1}^nL\left( x_i \right)=\dfrac1n\left( k\sum_{i=1}^nx_i+nb \right)=k\left( \dfrac1n\sum_{i=1}^nx_i \right)+b=L\left( \dfrac1n\sum_{i=1}^nx_i \right),$$
又因为$f\left( x\right)\ge L\left( x \right)$, 所以就能证明琴生不等式, 取等条件很明显就是 $\displaystyle L\left( \dfrac1n\sum_{i=1}^nx_i \right)=f\left( \dfrac1n\sum_{i=1}^nx_i \right)$, 结合图像就更好理解了: 
```desmos-graph
left = -3; right = 8;
top = 5; bottom = -2;
width = 800; height = 300;
grid=false;
hideAxisNumbers=false;
---
y=x^2|black
y=2x-1|black
\left(0, 0\right)|black|label:`\left( 0,0 \right)`
\left(1, 1\right)|black|label:`\left( 1,1 \right)`
\left(2, 4\right)|black|label:`\left( 2,4 \right)`
x=0\left\{ -1\le y\le0 \right\}|dashed|black
x=2\left\{ 3\le y\le4 \right\}|dashed|black
\left(0,-1\right)|black|label:`\left( 0,-1 \right)`
\left(2, 3\right)|black|label:`\left( 2,3 \right)`
```
图中的意义非常明确, $f\left( 0 \right)+f\left( 1 \right)+f\left( 2 \right)$ 每一项都大于等于直线上对应的值, 所以
$$f\left( 0 \right)+f\left( 1 \right)+f\left( 2 \right)\ge L\left( 0 \right)+L\left( 1 \right)+L\left( 2 \right)=L\left( 0+1+2 \right)=3L\left( 1 \right),$$
如果恰好等于相切的点, 那就可以取到等, 否则就不能. 

也就是说, 我们现在把一个函数放成了直线, 直线有非常好的线性关系, 可以把自变量求和在一起, 然后就能归到一个点上. 如果这个点能够还原回原本的函数, 那么就能取到等. 

之所以说切线不等式时琴生不等式的一个强命题, 是因为琴生不等式要求函数时凸函数, 但切线不等式只要求恒大于等于切线就行了, 而凸函数能保证恒大于等于. 除此之外, 切线还能考虑凹函数, 也就是相反的情况: 
```desmos-graph
left = -3; right = 8;
top = 2; bottom = -5;
width = 800; height = 300;
grid=false;
hideAxisNumbers=false;
---
y=-x^2|black
y=-2x+1|black
\left(0, 0\right)|black|label:`\left( 0,0 \right)`
\left(1, -1\right)|black|label:`\left( 1,-1 \right)`
\left(2, -4\right)|black|label:`\left( 2,-4 \right)`
x=0\left\{ 0\le y\le1 \right\}|dashed|black
x=2\left\{ -4\le y\le-3 \right\}|dashed|black
\left(0,1\right)|black|label:`\left( 0,1 \right)`
\left(2, -3\right)|black|label:`\left( 2,-3 \right)`
```
这个时候不等式方向相反, 其余都是一样的. 甚至如果不等式足够送, 都不一定要是切线, 只需要保证恒大于就可以了.

## 用途
>已知正实数 $a,b,c$ 满足 $a^2+b^2+c^2=3$. 求证: $\dfrac1{2-a}+\dfrac1{2-b}+\dfrac1{2-c}\ge3$. 

首先猜取等条件: $a=b=c=1$ 时取等; $a=0,~b=c=\sqrt{\dfrac32}$ 和 $a=b=0,~c=\sqrt3$ 时显然不取等, 所以我们暂时能找到的取等条件是 $a=b=c=1$.

我们猜测可以用切线放缩, 由于取等条件是 $a=b=c=1$, 所以就是目标函数在 $x=1$ 处的切线. 要注意条件中有平方, 不等式中却是一次, 所以要根号. 
令 $f\left( x \right)=\dfrac1{2-\sqrt x}~\left( x\in\left( 0,3 \right) \right)$, 则 $f\left( x \right)=\dfrac1{2x^{\frac32}-8x+8x^{\frac12}}~\left( x\in\left( 0,3 \right) \right)$, 我们猜测的切线的斜率为 $f'\left( 1 \right)=\dfrac12$, 于是计算处切线 $L\left( x \right)=\dfrac12x+\dfrac12$. 
现在尝试证明: 令 $x=y^2,~y\in\left( 0,\sqrt3 \right)$, 则
$$\begin{align*}
f\left( x \right)\ge L\left( x \right)~
&\Leftrightarrow~\dfrac1{2-y}\ge\dfrac12y^2+\dfrac12\\
&\Leftrightarrow~1\ge\left( y^2+1 \right)\left( 2-y \right)\\
&\Leftrightarrow~-y\left( y-1 \right)^2\le0.
\end{align*}$$
显然成立, 当且仅当 $x=1$ 时取等, 所以我们可以直接放缩: 
$$\dfrac1{2-a}+\dfrac1{2-b}+\dfrac1{2-c}\ge\dfrac12a^2+\dfrac12+\dfrac12b^2+\dfrac12+\dfrac12c^2+\dfrac12=\dfrac12\left( a^2+b^2+c^2 \right)+\dfrac32=3.$$
另外说一下, 在证明引理时因式分解必然会一个平方项, 因为是切线, 如果某次化简没有出现, 那很有可能是算错了. 
但在答题卡上就不是这么写的, 你不需要告诉老师这个不等式是怎么发现的, 只需要说要用到这个不等式就可以老, 应该这样写:
>引理: $\dfrac1{2-\sqrt x}\ge\dfrac12x+\dfrac12$.
>(然后证明一遍这个引理)
>故
>$$\dfrac1{2-a}+\dfrac1{2-b}+\dfrac1{2-c}\ge\dfrac12a^2+\dfrac12+\dfrac12b^2+\dfrac12+\dfrac12c^2+\dfrac12=\dfrac12\left( a^2+b^2+c^2 \right)+\dfrac32=3.$$
>当且仅当 $a=b=c=1$ 时取等. 

这样就完整地证明了这道题. 

---
>已知点 $F$ 是椭圆 $C:\dfrac{x^2}{16}+\dfrac{y^2}{12}=1$ 的左焦点, 过点 $F$ 的相互垂直的两条直线 $l_1,~l_2$ 与椭圆分别交于 $A,C,B,D$ 四个点, 求 $| \overrightarrow{AC} |+| \overrightarrow{BD} |$<!--不要使用\left和\right, 因为向量箭头要在绝对值外面-->. 

这个的标答比较长, 比较吓人, 而且很明显做复杂了, 感兴趣的同学可以自己用搜题软件拍一下看看, 事实上用常规方法做和琴生不等式的复杂度差不多. 我们直接讲用琴生不等式的方法.

>使用二级结论, 
>$$\begin{align*}
|\overrightarrow{FA}|&=m=\dfrac6{2-\cos\theta},\\
|\overrightarrow{FC}|&=n=\dfrac6{2+\cos\theta},\\
|\overrightarrow{FB}|&=p=\dfrac6{2+\sin\theta},\\
|\overrightarrow{FD}|&=q=\dfrac6{2-\sin\theta}.
\end{align*}$$
>其中 $\theta\in[0,\pi)$, 于是
>$$\begin{align*}
| \overrightarrow{AC} |+| \overrightarrow{BD} |
&=\left( m+n \right)+\left(p+q\right)\\
&=24\left( \dfrac1{4-\cos^2\theta}+\dfrac1{4-\sin^2\theta} \right)\\
&=\dfrac{168}{12+\sin^2\theta\cos^2\theta}\\
&\ge\dfrac{168}{12+\dfrac14}\\
&=\dfrac{96}{7}.
\end{align*}$$
>其中琴生不等式的函数是 $f\left( x \right)=\dfrac1{4-x}$, $f''\left( x \right)=\dfrac2{\left( 4-x \right)^3}>0$ 可证明是凸函数. 
>三角不等式的取等条件是
$$\sin^2\theta=\cos^2\theta=\dfrac12~\Leftrightarrow~\theta=\dfrac\pi4\text{或}\dfrac{3\pi}4.$$
>琴生不等式的取等条件也是 $\cos^2\theta=\sin^2\theta$, 两个不等号同时取等.

课后习题:
1. 实数 $a,b,c$ 满足 $a^2+b^2+c^2=3$. 求证: $\dfrac1{a^3+2}+\dfrac1{b^3+2}+\dfrac1{c^3+2}\ge1$. 
2. (高联模拟题, 9, 16分) 已知 $f\left( x \right)=\begin{cases}\dfrac{3+x}{x^2+1},&0\le x\le3,\\\dfrac35,&x>3\end{cases}$, 数列 $\left\{ a_n \right\}$ 满足 $0<a_n\le3~\left( n\in\mathbb N^* \right)$, 且 $\displaystyle\sum_{i=1}^{2023}a_i=\dfrac{2023}3$. 若 $\displaystyle\sum_{i=1}^{2023}f\left( a_i \right)\le x-\ln\left( x-p \right)$ 对于 $x\in\left( p,+\infty \right)$ 恒成立, 求实数 $p$ 的最小值.

习题答案放在了[[(2) 习题答案#(4)° 琴生 (Jensen) 不等式 & 切线不等式]]. 