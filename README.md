# OrbitForge · 引力锻造炉

<p align="center">
  <a href="https://github.com/CJX0712/orbit-forge/actions/workflows/ci.yml"><img src="https://github.com/CJX0712/orbit-forge/actions/workflows/ci.yml/badge.svg" alt="ci"></a>
  <a href="https://github.com/CJX0712/orbit-forge/releases"><img src="https://img.shields.io/github/v/release/CJX0712/orbit-forge?sort=semver" alt="release"></a>
  <a href="https://github.com/CJX0712/orbit-forge/blob/main/LICENSE"><img src="https://img.shields.io/github/license/CJX0712/orbit-forge" alt="license"></a>
  <img src="https://img.shields.io/badge/author-%E6%99%A8%E6%98%9F-1f6feb" alt="author">
</p>

单文件离线 2D 引力 n-body 模拟器。两两牛顿万有引力（带 softening），速度 Verlet 积分，canvas 绘制天体与轨道尾迹。

> 动量严格守恒、能量近似守恒、二体可成圆轨道——不是「看起来像物理」，是能跑守恒律验证的物理。

## 功能

- **n-body 引力**：任意数量天体，两两牛顿引力 `F = G·m₁·m₂/(r²+ε²)`
- **速度 Verlet 积分**：比欧拉法更守恒能量，动量逐帧精确守恒
- **轨道尾迹**：每个天体保留最近 80 帧轨迹，直观看轨道形状
- **确定性种子**：同种子 + 同数量 = 同一宇宙
- **实时守恒律显示**：总动量 |P|、总能量 E、能量漂移百分比
- **内置自检**：浏览器内一键验证守恒律与轨道正确性

## 物理验证（无头）

引擎逻辑抽离为纯函数，`_smoke.js` 在 Node 下做不变量校验，**8/8 全绿**：

- **动量守恒**：800 步 |P| 漂移 < 1e-6（内力对称，速度 Verlet 精确守恒）
- **能量守恒**：800 步相对漂移 < 1%
- **牛顿第三定律**：系统合力 ≈ 0
- **二体圆轨道**：给定解析速度 `v=√(GM/r)`，400 步半径偏差 < 5%
- **种子确定性 / 区分**
- **数值稳定**：200 步无 NaN/Inf
- **单步推进 + 逐帧动量保持**

实测示例（种子「晨星」12 体，300 步）：能量漂移 **0.000%**，总动量 |P|=7.2572 始终不变。

```bash
node _smoke.js      # 引擎不变量测试
node _probe.js      # 生成最终状态表到 _probe.txt
```

## 使用

直接用浏览器打开 `index.html` 即可，零外部依赖、可离线运行。

## 许可

MIT — 见 [LICENSE](LICENSE)。
