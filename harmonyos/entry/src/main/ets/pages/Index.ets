import { webview } from '@kit.ArkWeb'

@Entry
@Component
struct Index {
  private controller: webview.WebviewController = new webview.WebviewController()

  aboutToAppear(): void {
    webview.WebviewController.setWebDebuggingAccess(false)
  }

  build() {
    Stack() {
      Web({
        src: 'resource://rawfile/web/index.html',
        controller: this.controller
      })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#050913')
  }
}
