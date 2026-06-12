# Vector Field Lab HarmonyOS

这是 Vector Field Lab 的 HarmonyOS 移动端壳工程。它不重写 React/Canvas 业务逻辑，而是用 ArkWeb 加载 Vite 构建后的本地静态资源。

## 同步 Web 资源

在仓库根目录运行：

```bash
npm run harmonyos:sync
```

脚本会执行前端生产构建，并把 `dist/` 复制到：

```text
harmonyos/entry/src/main/resources/rawfile/web/
```

该目录的生成内容已被 `.gitignore` 忽略，只保留 `.gitkeep`。

## DevEco Studio 打开

1. 安装 DevEco Studio 与 HarmonyOS SDK。
2. 运行 `npm run harmonyos:sync`。
3. 用 DevEco Studio 打开 `harmonyos/` 目录。
4. 配置签名后，选择 phone/tablet 设备构建或运行。

## 设计说明

- `entry/src/main/ets/pages/Index.ets` 使用 `Web` 组件加载 `resource://rawfile/web/index.html`。
- Vite 已配置 `base: './'`，因此构建产物可以在 rawfile 子目录中用相对路径加载 JS/CSS/font。
- 应用入口不依赖外网；首次安装后资源随 HAP 包一起分发。
- 运行质量仍由 Web 端的 high / balanced / safe 档位控制，平板建议使用 `safe`。

## 本地限制

当前仓库内提供 HarmonyOS 工程源码和资源同步脚本。本机未内置 DevEco Studio/HarmonyOS SDK 时，无法在命令行完成 HAP 实机构建；需要在 DevEco Studio 中完成签名和打包。
