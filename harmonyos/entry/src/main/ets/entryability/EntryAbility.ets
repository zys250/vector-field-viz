import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit'
import { hilog } from '@kit.PerformanceAnalysisKit'
import { window } from '@kit.ArkUI'

const DOMAIN = 0x0000

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN, 'VectorFieldLab', 'EntryAbility onCreate')
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'VectorFieldLab', 'EntryAbility onDestroy')
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'VectorFieldLab', `Failed to load content. code: ${err.code}, message: ${err.message}`)
        return
      }
      hilog.info(DOMAIN, 'VectorFieldLab', 'Loaded pages/Index')
    })
  }

  onWindowStageDestroy(): void {
    hilog.info(DOMAIN, 'VectorFieldLab', 'WindowStage destroyed')
  }

  onForeground(): void {
    hilog.info(DOMAIN, 'VectorFieldLab', 'EntryAbility foreground')
  }

  onBackground(): void {
    hilog.info(DOMAIN, 'VectorFieldLab', 'EntryAbility background')
  }
}
