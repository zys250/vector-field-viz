# Vector Field Lab 本地 Windows EXE 与 Android APK 封装可行性报告

日期：2026-06-09  
项目：React + Vite + Canvas 2D 纯前端可视化应用  
目标：摆脱校园网、局域网、临时隧道的不稳定性，让项目能以 Windows 本地 EXE 和 Android 手机 APK 形式携带运行。

## 1. 结论

**可行，而且项目类型非常适合封装。** 当前项目没有后端、数据库或外部 API 依赖，`npm run build` 已能生成静态 `dist/`，这正是 Electron、Tauri、Capacitor 这类壳应用最容易承载的形态。

推荐路线：

1. **Android APK：优先用 Capacitor。** 它就是为“把现代 Web 项目放进原生移动端 WebView”设计的，能把现有 `dist/` 变成可安装 APK。
2. **Windows EXE：短期优先 Electron portable，长期可考虑 Tauri。** Electron 最快、只依赖 Node/npm，适合先拿到可发给别人双击运行的 `.exe`；Tauri 包体更小，但需要 Rust、Windows C++ Build Tools 等额外工具链。
3. **PWA 继续保留，但不作为主交付方案。** PWA 适合“浏览器安装到桌面”，但首次安装仍需要通过 HTTPS/localhost 等合规环境访问；它不能完全替代可直接分发的 `.apk/.exe`。

## 2. 当前项目状态证据

本机检查结果：

| 项目 | 当前状态 | 对封装的影响 |
|---|---:|---|
| Node.js | `v24.15.0` | 满足 Capacitor 8 的 Node 22+ 要求 |
| npm | `11.12.1` | 可继续添加 Electron/Capacitor 依赖 |
| Web 构建 | `npm run build` 通过 | 可作为 EXE/APK 的 Web 输入 |
| PWA 基础 | 有 `manifest.webmanifest` 与 `service-worker.js` | 可离线增强，但 manifest 图标还需补 192/512 PNG |
| Java/JDK | 缺失 | 当前不能直接构建 Android APK |
| Android Studio/SDK/adb | 缺失 | 当前不能直接构建 Android APK |
| Rust/cargo | 缺失 | 当前不能直接构建 Tauri |
| 代码签名工具 | 缺失 | 不影响内部测试包，但影响正式发布可信度 |

注意：项目现有 `vite.config.ts` 使用 `base: './'`，这对本地封装很友好，因为打包后的资源路径不依赖固定域名。

## 3. 方案对比

| 方案 | 能否解决离网学习 | Windows EXE | Android APK | 首次工作量 | 当前本机可立即做 | 推荐度 |
|---|---|---:|---:|---:|---:|---|
| 静态 `dist.zip` | 部分解决 | 否 | 否 | 0.5 天 | 是 | 过渡方案 |
| PWA | 部分解决 | 类 EXE 体验 | 类 App 体验 | 0.5-1 天 | 是 | 保留增强 |
| Electron | 完全解决 Windows | 是 | 否 | 0.5-1 天 | 基本可做 | Windows 首选快速版 |
| Tauri v2 | 完全解决 Windows，可做移动端但较重 | 是 | 可做但不推荐本项目首选 | 1-2 天 | 否，缺 Rust | Windows 小体积版 |
| Capacitor | 完全解决 Android | 否 | 是 | 1-2 天 | 否，缺 Android 工具链 | Android 首选 |
| 原生 Android WebView | 完全解决 Android | 否 | 是 | 2-4 天 | 否 | 不建议，重复造轮子 |

## 4. 官方依据与关键限制

- MDN 对 PWA 的 installability 要求说明：PWA 至少需要 manifest；Chromium 还要求 `name/short_name`、192px 与 512px 图标、`start_url`、`display/display_override` 等；并且可安装 PWA 需要 HTTPS，或 `localhost/127.0.0.1` 本地开发环境。这意味着“校园网里用局域网 IP 打开一次再安装”不一定稳定合规，不能把 PWA 当成最终脱网分发方案。  
  来源：https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

- Capacitor 官方文档说明：Capacitor 是跨平台原生运行时，适合用现代 Web 工具构建 Android/iOS/Web；Android 项目通过 Android Studio 管理，Capacitor 8 需要 Node 22+、Android Studio 2025.2.1+、Android SDK，Android 支持 API 24+。当前本机 Node 满足，但 Android Studio/SDK 缺失。  
  来源：https://capacitorjs.com/docs 与 https://capacitorjs.com/docs/getting-started/environment-setup

- Android 官方文档说明：如果要快速测试或分享给别人，应该构建 APK；AAB 不能直接部署到设备，APK 输出通常在 `module/build/outputs/apk/`，可用 `adb install path/to/app.apk` 安装。  
  来源：https://developer.android.com/build/building-cmdline

- Electron Builder 官方文档说明：Windows target 可生成 `nsis`、`portable`、`msi`、`zip` 等；默认 Windows target 是 `nsis`，也支持 portable app without installation。Electron 适合快速产出 Windows `.exe`，代价是包体较大，因为会带 Chromium/Node 运行时。  
  来源：https://www.electron.build/docs/win

- Tauri 官方文档说明：Tauri 可面向桌面和移动平台，使用系统 WebView，Windows 使用 Microsoft Edge WebView2；Android 还需要 Android Studio、`ANDROID_HOME/NDK_HOME`、Rust targets 等。它体积优势明显，但本机当前缺 Rust/Android 工具链，不适合作为最快交付路线。  
  来源：https://v2.tauri.app/start/ 与 https://v2.tauri.app/start/prerequisites/

## 5. 推荐实施路线

### 阶段 A：先拿到 Windows 可携带 EXE

推荐：Electron + electron-builder `portable`。

原因：

- 当前本机已经有 Node/npm，可最快启动；
- 对现有 React/Vite 项目侵入小；
- 产物可以是单个 portable `.exe`，发给同学或放 U 盘更直接；
- 不依赖校园网、不需要电脑开本地服务。

预计产物：

```text
release/
  Vector Field Lab.exe          # portable 便携版，双击运行
  Vector Field Lab Setup.exe    # 可选，NSIS 安装版
```

预估风险：

- 包体可能 120-250MB；
- 未签名 EXE 可能触发 Windows SmartScreen，需要用户选择“仍要运行”；
- 需要补应用 icon、窗口标题、离线资源加载策略。

### 阶段 B：再做 Android APK

推荐：Capacitor。

原因：

- 与 React/Vite 静态构建天然匹配；
- Android 设备使用系统 WebView，包体比 Electron 类桌面壳小很多；
- 后续如需屏幕方向、文件、触控反馈等原生能力，Capacitor 插件生态更直接。

需要先安装：

```text
Android Studio 2025.2.1+
Android SDK Platform API 24+
Android SDK Build Tools
Android Platform Tools / adb
```

预计产物：

```text
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
```

安装说明：

- 内部测试可先用 debug APK；
- 发给别人手机时，需要开启“允许安装未知来源应用”；
- 正式长期分发应做 release 签名 APK，并保存 keystore。

### 阶段 C：保留 PWA 与静态离线包作为兜底

PWA 不建议作为唯一方案，但值得保留：

- Windows/Android 浏览器可“添加到主屏幕/安装”；
- 首次安装成功后，后续可离线打开；
- 可作为不想安装 EXE/APK 时的轻量入口。

当前 PWA 需补：

- `192x192` 和 `512x512` PNG 图标；
- 浏览器安装流程说明；
- 首次缓存完成后的离线验证步骤。

## 6. 不推荐路线

1. **继续依赖 LAN / 校园网 / SSH tunnel。** 这正是当前痛点，环境越复杂越不适合教学携带。
2. **只发 `dist/` 文件夹让手机用 file:// 打开。** 能跑一部分静态资源，但 Service Worker 不工作，也不是 APK。
3. **Android 原生 WebView 手写壳。** 可以做，但 Capacitor 已经把同步、构建、Android Studio 项目结构处理好了，没必要重写。
4. **Tauri 同时承担 Windows + Android 首发。** 技术上可行，但当前工具链缺口更大；对这个纯前端教学项目，Capacitor 做 Android 更稳。

## 7. 具体落地清单

### Windows EXE

1. 添加 Electron 主进程入口，例如 `electron/main.cjs`。
2. 添加 `electron-builder` 配置：`portable` 为主，`nsis` 可选。
3. 让 Electron 加载 `dist/index.html`，禁止依赖远程 URL。
4. 添加脚本：
   - `desktop:dev`
   - `desktop:build`
   - `desktop:pack`
5. 构建并验证：
   - 双击 EXE 打开；
   - 无网络时可进入 10 个章节；
   - Canvas 动画与公式字体正常；
   - Windows 11 普通用户权限下可运行。

### Android APK

1. 安装 Android Studio/SDK。
2. 添加 Capacitor：
   - `npm install @capacitor/core @capacitor/cli @capacitor/android`
   - `npx cap init "Vector Field Lab" "com.vectorfield.lab" --web-dir dist`
   - `npx cap add android`
3. 每次构建流程：
   - `npm run build`
   - `npx cap sync android`
   - `npx cap open android` 或 `cd android && .\gradlew assembleDebug`
4. 验证：
   - 真机安装 APK；
   - 飞行模式下打开；
   - 横屏/竖屏、触控拖拽、滚动面板、Canvas 性能；
   - 长时间运行不明显掉帧或发热过高。

## 8. 时间与成本预估

| 任务 | 乐观 | 稳妥 | 备注 |
|---|---:|---:|---|
| Windows Electron portable | 2-4 小时 | 0.5-1 天 | 本机可直接开始 |
| Windows Tauri 小体积版 | 0.5-1 天 | 1-2 天 | 需 Rust/Build Tools |
| Android Capacitor APK | 0.5-1 天 | 1-2 天 | 主要时间花在 Android Studio/SDK |
| PWA 完整安装体验 | 1-2 小时 | 0.5 天 | 需补 PNG icons 与安装说明 |
| 真机/离线/性能验收 | 2-4 小时 | 0.5 天 | 安卓真机很关键 |

## 9. 最终建议

**建议采用“双轨交付”：Windows 用 Electron portable EXE，Android 用 Capacitor APK。**

理由很简单：这个项目的学习场景需要“拿着就能跑”，不是“配置网络后访问电脑”。EXE/APK 都把 `dist/` 包进本地应用壳，彻底绕开校园网、同一 Wi-Fi、端口、防火墙、隧道稳定性这些问题。PWA 继续保留为增强入口，但不再承担主交付责任。

当前最现实的下一步：

1. 先做 Windows Electron portable EXE，最快验证“离开网络也能跑”。
2. 同时安装 Android Studio/SDK。
3. Android 工具链就绪后接 Capacitor，产出 debug APK 真机测试。
4. 通过后再做 release APK 签名和简短安装说明。
