# HarmonyOS 移动端封装

本项目的 HarmonyOS 版本位于 `harmonyos/`。它是一个 Stage 模型 ArkTS 工程，用 ArkWeb 的 `Web` 组件加载现有 Vite 构建产物。

## 为什么这样做

项目主体已经是纯前端 Canvas 应用，数学计算、交互、质量档位和缓存层都在 Web 端实现。HarmonyOS 端重写这些逻辑会增加维护成本，也容易造成平台间行为不一致。因此当前采用“原生壳 + 本地 Web 资源”的路线：

```text
React/Vite/Canvas 源码
  -> npm run build
  -> dist/
  -> npm run harmonyos:sync
  -> harmonyos/entry/src/main/resources/rawfile/web/
  -> ArkWeb Web({ src: 'resource://rawfile/web/index.html' })
```

## 使用步骤

在仓库根目录运行：

```bash
npm run harmonyos:sync
```

然后用 DevEco Studio 打开：

```text
harmonyos/
```

在 DevEco Studio 中完成：

1. 安装或选择 HarmonyOS SDK。
2. 配置调试签名。
3. 选择 phone 或 tablet 设备。
4. 构建并运行 entry 模块。

## 文件说明

```text
harmonyos/
  AppScope/app.json5                         应用级配置
  build-profile.json5                        DevEco 构建配置
  entry/src/main/module.json5                entry 模块配置
  entry/src/main/ets/entryability/           UIAbility
  entry/src/main/ets/pages/Index.ets         全屏 ArkWeb 页面
  entry/src/main/resources/rawfile/web/      Vite 构建产物同步目标
scripts/sync-harmonyos.mjs                   dist -> rawfile/web 同步脚本
```

## 注意事项

- `rawfile/web/` 下的生成文件已被 `.gitignore` 忽略，避免把构建产物提交进仓库。
- Vite 配置使用 `base: './'`，确保 JS/CSS/font 资源能以相对路径从 rawfile 目录加载。
- 当前命令行只验证 Web 构建和资源同步；HAP 构建依赖 DevEco Studio 与 HarmonyOS SDK。
- 平板长时间演示建议在应用内切换到 `safe` 档位。

## 后续增强

- 用真实品牌图标替换当前 SVG 占位图标。
- 在 DevEco Studio 中生成并保存 release 签名配置。
- 增加真机验收记录：首次启动、横竖屏、触控拖拽、2 小时 safe 档稳定运行。
