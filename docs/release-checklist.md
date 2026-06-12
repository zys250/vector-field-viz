# 发布检查表

## 每次发布前

- [ ] 运行 `npm run check`，确认 test/lint/build 全部通过。
- [ ] 打开首页，确认 10 个章节卡片和章节导航正常。
- [ ] 手动验收 Ch3、Ch4、Ch5、Ch6、Ch8、Ch9。
- [ ] 在 Ch5 依次点击刚体旋转、剪切流、软涡核、源流、常量场、鞍点场，确认读数与桨轮行为一致。
- [ ] 切换 high / balanced / safe，确认运行设置面板显示正常，动画不卡死。
- [ ] 在平板或窄屏模拟下确认右侧说明面板、底部导航和运行设置不会遮挡主要操作。

## Windows 包

- [ ] 运行 `npm run desktop:pack`。
- [ ] 启动 `release/windows/Vector Field Lab-*-portable.exe`。
- [ ] 无控制台错误，窗口标题和应用名正确。
- [ ] 离线打开仍能看到已打包资源。

## Android 包

- [ ] 确认本机 JDK 与 Android SDK 可用。
- [ ] 运行 `npm run android:debug`。
- [ ] 安装 `android/app/build/outputs/apk/debug/app-debug.apk` 到真机或模拟器。
- [ ] 验证触控拖拽、横竖屏、返回键和长时间运行发热情况。

## HarmonyOS 包

- [ ] 运行 `npm run harmonyos:sync`。
- [ ] 用 DevEco Studio 打开 `harmonyos/`。
- [ ] 配置 HarmonyOS SDK 和调试/发布签名。
- [ ] 在 phone/tablet 真机或模拟器运行 entry 模块。
- [ ] 验证首页、Ch4 高斯解释、Ch5 剪切流桨轮、运行设置面板和 `safe` 档稳定性。

## GitHub Release

- [ ] 更新版本号和变更摘要。
- [ ] 上传 Windows portable 包。
- [ ] 上传 Android APK。
- [ ] 若面向鸿蒙设备分发，上传签名后的 HarmonyOS HAP 或给出 DevEco 构建说明。
- [ ] 说明推荐运行档位：桌面 `balanced/high`，平板 `safe`。
- [ ] 若公开源码，确认 LICENSE 已添加并符合项目预期。

## 后续建议

- 添加正式 192/512 PNG 图标，完善 PWA installability。
- 给 release 包增加签名或校验和。
- 若面向课堂使用，补一份简短的“教师演示路线”文档。
