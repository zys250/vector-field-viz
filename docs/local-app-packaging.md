# Vector Field Lab 本地应用打包交付说明

日期：2026-06-09

本项目已经接入两条本地运行交付链：

- Windows：Electron portable `.exe`
- Android：Capacitor debug `.apk`

两者都会把 Vite 构建出来的 `dist/` 静态资源放进本地应用，不再依赖校园网、局域网 IP、SSH 隧道或电脑开服务。

## 已生成产物

Windows 便携版：

```text
release/windows/Vector Field Lab-0.1.0-portable.exe
```

Android 调试安装包：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 常用命令

完整 Web 检查：

```bash
npm run check
```

构建 Windows 便携 EXE：

```bash
npm run desktop:pack
```

构建 Android debug APK：

```bash
npm run android:debug
```

仅同步 Web 资源到 Android 工程：

```bash
npm run android:sync
```

用 Android Studio 打开工程：

```bash
npm run android:open
```

## Windows 使用方式

把下面文件发给别人即可：

```text
release/windows/Vector Field Lab-0.1.0-portable.exe
```

对方双击运行。因为当前没有代码签名证书，Windows 可能显示 SmartScreen 提醒，需要选择“更多信息 / 仍要运行”。

## Android 使用方式

把下面文件发到手机：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

手机上打开 APK 并允许“安装未知来源应用”。这是 debug 包，适合自用、课堂测试、快速分发。正式长期分发建议后续生成 release 签名包。

## 本机工具链说明

本机已经额外准备：

- JDK 21：`%LOCALAPPDATA%\VectorFieldLabToolchain\jdk21`
- Android SDK：`%LOCALAPPDATA%\Android\Sdk`
- Android SDK Platform：36
- Android Build Tools：36.0.0
- Android Platform Tools：37.0.0

`scripts/build-android-debug.ps1` 会优先自动识别这些位置，因此通常不需要手动设置 `JAVA_HOME` 或 `ANDROID_HOME`。

## 关键文件

```text
electron/main.cjs                         Electron 主进程，加载 dist/index.html
capacitor.config.ts                       Capacitor 应用配置
android/                                  Capacitor 生成的 Android 原生工程
scripts/build-android-debug.ps1           Android debug APK 自动构建脚本
package.json                              desktop/android 打包脚本与 electron-builder 配置
```

## 复构建流程

Windows：

```bash
npm install
npm run desktop:pack
```

Android：

```bash
npm install
npm run android:debug
```

如果 Android 构建提示缺 SDK，可用 Android CLI 安装：

```powershell
android sdk install "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

如果 Gradle 官方下载超时，本工程已把 wrapper 分发地址切到阿里云 Gradle 镜像：

```text
android/gradle/wrapper/gradle-wrapper.properties
```

## 后续正式发布建议

- 为 Windows EXE 添加 `.ico` 图标和代码签名证书。
- 为 Android APK 添加正式图标、应用名中文本地化、release keystore。
- 用真机验证触控拖拽、竖屏/横屏、飞行模式离线打开和长时间运行发热情况。
