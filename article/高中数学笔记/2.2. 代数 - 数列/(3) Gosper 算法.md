正如[[(1) 数列]]中所说, 计算数列 $\left\{ t_n \right\}$ 求和的核心方法之一就是找到另一个数列 $\left\{ z_n \right\}$, 使得 $t_n=z_{n+1}-z_n$, 这样就能实现
$$S_n=\sum_{i=1}^nt_n=z_{n+1}-z_n+z_n-z_{n-1}+\cdots+z_2-z_1=z_{n+1}-z_1,$$
即完成化简. 其中 $t_n$ 是 $z_n$ 的差分数列, 这样的行为叫做反差分. 

但找到这样的 $\left\{ z_n \right\}$ 并不是什么简单的事, 好在美国数学家和程序员 Gosper 发现了一种机械的方式求出这样的 $\left\{ z_n \right\}$ . 

>已知数列 $t_n=n2^n$, 求数列 $t_n$ 的前 $n$ 项和 $S_n$. 

这个数列是差比数列, 可以用错位相减的方法解决. 现在我们看看用 Gosper 算法裂项相消的方法. 

首先判断一个数列能不能用 Gosper 算法, 先求出相邻项比值 $R\left( n \right)=\dfrac{t_{n+1}}{t_n}$, 若 $R\left( n \right)$ 是有理函数 (即存在多项式函数 $f\left( n \right)$ 和 $g\left( n \right)$, 使得 $R\left( n \right)=\dfrac{f\left( n \right)}{g\left( n \right)}$), 那么 $t_n$ 就是**超几何项**, 只有超几何项才可能可以使用 Gosper 算法. 

题目中, $R\left( n \right)=\dfrac{t_{n+1}}{t_n}=\dfrac{2n+1}n$ 是有理函数, $t_n$ 是超几何项, 可以使用. 

我们有 $z_n=r\left( n \right)t_n$, 其中 $r\left( n \right)$ 是有理函数, 常为多项式函数. 进而 $r\left( n+1 \right)t_{n+1}-r\left(n \right)t_n=t_n$. 进一步两边除以 $t_n$, 得到 $r\left( n+1 \right)R\left( n \right)-r\left(n \right)=1$.

我们一般通过待定系数法来求出 $r_n$, 先猜测 $z_n=\left( An+B \right)2^n$, 于是
$$z_{n+1}-z_n=\left( A\left( n+1 \right)+B \right)2^{n+1}-\left( An+B \right)2^n=2^n\left( An+2A+B \right)=t_n=n2^n,$$
于是 $\begin{cases}A=1,\\2A+B=0\end{cases}$, 解得$\begin{cases}A=1,\\B=-2\end{cases}$, 于是 $z_n=\left( n-2 \right)2^n$, 验证发现确实正确. 于是
$$\begin{align*}
S_n
&=\sum_{i=1}^nt_i=\left( n-1 \right)2^{n+1}-\left( n-2 \right)2^n+\left( n-2 \right)2^n-\left( n-3 \right)2^{n-1}+\cdots+0-\left( -1 \right)2^1\\
&=\left( n-1 \right)2^{n+1}+2.
\end{align*}$$

课后习题: 
已知数列 $t_n=n!~n$, 求数列 $t_n$ 的前 $n$ 项和 $S_n$. 