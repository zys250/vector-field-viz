# Vector Field Lab

Vector Field Lab 是一个面向向量分析、流体直觉和电磁学直觉的交互式可视化实验室。项目使用 React、Vite、Zustand 与 Canvas 2D，把向量场、线积分、微分算子、流体和物理场放到同一套坐标、数值计算与交互语言里。

当前目标是：在普通浏览器、Windows 桌面应用、Android 平板和 HarmonyOS 设备上都能稳定运行，适合课堂演示、自学复盘和后续开源分享。

## 实验内容

1. 向量场入门：箭头、场线和示踪粒子。
2. 通量：可编辑有向曲线与法向分量累加。
3. 环量：闭合回路、切向分量与流动粒子。
4. 散度：热力图、局部通量探针与高斯定理直觉。
5. 旋度：热力图、小桨轮、剪切流和软涡核示例。
6. 二维电场：点电荷叠加与二维高斯关系。
7. 磁场与感应：载流直导线、法拉第定律与楞次定律。
8. 液态流体：不可压缩水流、染料粒子、小圆通量和局部旋度。
9. 气体流动：膨胀、压缩、密度直觉和散度/通量对应。
10. 三维投影：自定义 3D 标量或向量函数，投影到倾斜平面并观察梯度、散度和通量。

## 快速开始

```bash
npm install
npm run dev
```

完整检查：

```bash
npm run check
```

`npm run check` 会依次运行单元测试、ESLint 和生产构建。

## 运行与分发

浏览器开发：

```bash
npm run dev
npm run dev:lan
```

生产预览：

```bash
npm run build
npm run preview
npm run preview:lan
```

Windows 桌面应用：

```bash
npm run desktop:pack
```

Android 调试包：

```bash
npm run android:debug
```

HarmonyOS 工程资源同步：

```bash
npm run harmonyos:sync
npm run harmonyos:open
```

同步后用 DevEco Studio 打开 `harmonyos/`，配置 HarmonyOS SDK 和签名后构建 HAP。说明见 [docs/harmonyos-packaging.md](docs/harmonyos-packaging.md)。

当前项目也保留 PWA/service worker 作为浏览器增强能力，但主交付建议优先使用 Windows 可执行文件、Android APK 或 HarmonyOS HAP。应用内的网络/离线缓存状态不会常驻画布，只在“运行设置”面板的诊断区显示。

## 运行质量档位

运行设置面板提供统一质量档位：

| 档位 | 帧率目标 | 粒子 | 场线 | 热图网格 | 建议场景 |
| --- | ---: | ---: | ---: | ---: | --- |
| high | 60fps | 120 | 60 | 38 | 桌面电脑、录屏展示 |
| balanced | 40fps | 80 | 42 | 30 | 默认模式、普通笔记本 |
| safe | 24fps | 48 | 26 | 24 | 平板、长时间投屏、省电稳定 |

Canvas 动画使用 `requestAnimationFrame` 时间戳步进；页面隐藏后暂停/降载，恢复时重置时间基准。若连续超出帧预算，运行时会自动降一档，避免长时间演示时越跑越卡。

## 关键概念说明

### 旋度与小桨轮

“只有旋转场里小桨轮会转”是常见误解。小桨轮响应的是局部旋度，不是“有没有速度”或“整体是否绕中心转”。

- 刚体旋转：整体绕中心旋转，curl 为常量。
- 剪切流：不绕中心旋转，但上下流速不同，小桨轮会转。
- 软涡核：旋度集中在核心附近，远离核心后减弱。
- 源流/常量场/鞍点场：可以有明显流动，但局部 curl 接近 0 时不自转是正确结果。

### 高斯公式的几何直觉

散度看一点附近是否有净流出。把区域切成许多小格子后，内部相邻边界上的通量会一正一负抵消，最后只剩外边界的净通量：

```text
∮∂S F · n ds = ∬S div F dA
```

三维时，闭合曲线换成闭合曲面，面积累加换成体积累加：

```text
∯∂V F · n dS = ∭V div F dV
```

所以“表面通量”和“体积散度”不是两件孤立的事：前者是边界上看到的总流出，后者是内部源汇逐点累加后的同一结果。

### 二维电场模型

电场实验采用二维静电类比：

```text
E = kQ / r · r_hat
```

因此闭合曲线通量满足：

```text
∮ E · n_hat ds = 2πkQ_enc
```

这不是三维空间中按 `1/r²` 衰减的真实库仑场。这样选择是为了让二维画布上的闭合曲线通量与包围净电荷保持一致。

更多几何解释见 [docs/vector-calculus-geometry.md](docs/vector-calculus-geometry.md)。

## 外部数值验证

前端运行不依赖 Python 或 Matlab。若要离线复核模型，可以使用本机 Python + NumPy + Matplotlib：

```bash
python scripts/validate_models.py
```

脚本会检查水流散度、3D 标量投影梯度，并生成：

```text
docs/generated/model-validation.png
```

## 仓库结构

```text
src/
  chapters/          十个实验模块
  components/        布局、面板、指标卡与可视化舞台
  config/            章节元数据
  engine2d/          Canvas、坐标变换、缓存层和绘制函数
  math/              向量、场、积分、散度、旋度、流体和投影
  runtime/           运行预算、PWA/service worker 注册
  store/             Zustand 应用、场、场景与运行状态
public/
  manifest.webmanifest
  service-worker.js
scripts/
  lan-info.mjs       打印局域网访问地址
  tunnel.mjs         SSH 公网隧道
  firewall.bat       Windows 防火墙规则辅助脚本
  validate_models.py 外部数值验证
docs/
  local-app-packaging.md
  harmonyos-packaging.md
  vector-calculus-geometry.md
  release-checklist.md
harmonyos/
  entry/             HarmonyOS Stage/ArkTS 移动端壳工程
```
