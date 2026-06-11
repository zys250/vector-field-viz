import { lazy, Suspense, useCallback } from 'react'
import AppShell from './components/layout/AppShell'
import TopBar from './components/layout/TopBar'
import BottomControls from './components/layout/BottomControls'
import ChapterIndex from './chapters/ChapterIndex'
import { useAppStore } from './store/useAppStore'
import { useSceneStore } from './store/useSceneStore'
import { useFieldStore } from './store/useFieldStore'
import { CHAPTER_MAP, CHAPTERS, type ChapterKey } from './config/chapters'

const Ch1Intro = lazy(() => import('./chapters/ch1-intro/Ch1Intro'))
const Ch2Flux = lazy(() => import('./chapters/ch2-flux/Ch2Flux'))
const Ch3Circulation = lazy(() => import('./chapters/ch3-circulation/Ch3Circulation'))
const Ch4Divergence = lazy(() => import('./chapters/ch4-divergence/Ch4Divergence'))
const Ch5Curl = lazy(() => import('./chapters/ch5-curl/Ch5Curl'))
const Ch6Electric = lazy(() => import('./chapters/ch6-electric/Ch6Electric'))
const Ch7Magnetic = lazy(() => import('./chapters/ch7-magnetic/Ch7Magnetic'))
const Ch8Water = lazy(() => import('./chapters/ch8-water/Ch8Water'))
const Ch9Gas = lazy(() => import('./chapters/ch9-gas/Ch9Gas'))
const Ch10Projection = lazy(() => import('./chapters/ch10-projection/Ch10Projection'))

export default function App() {
  const { currentChapter, setChapter, isPanelOpen, togglePanel, setPanelOpen } = useAppStore()
  const { resetViewport, resetSceneObjects } = useSceneStore()
  const setPreset = useFieldStore((state) => state.setPreset)

  const handleNavigate = useCallback((ch: ChapterKey) => {
    const chapter = CHAPTERS.find((item) => item.key === ch)
    if (chapter?.recommendedPreset) setPreset(chapter.recommendedPreset)
    setChapter(ch)
    resetViewport()
    resetSceneObjects()
    setPanelOpen(ch !== 'index')
  }, [resetSceneObjects, resetViewport, setChapter, setPanelOpen, setPreset])

  const chapterTitle = CHAPTER_MAP[currentChapter]

  const renderChapter = () => {
    switch (currentChapter) {
      case 'ch1': return <Ch1Intro key="ch1" />
      case 'ch2': return <Ch2Flux key="ch2" />
      case 'ch3': return <Ch3Circulation key="ch3" />
      case 'ch4': return <Ch4Divergence key="ch4" />
      case 'ch5': return <Ch5Curl key="ch5" />
      case 'ch6': return <Ch6Electric key="ch6" />
      case 'ch7': return <Ch7Magnetic key="ch7" />
      case 'ch8': return <Ch8Water key="ch8" />
      case 'ch9': return <Ch9Gas key="ch9" />
      case 'ch10': return <Ch10Projection key="ch10" />
      default: return <ChapterIndex onNavigate={handleNavigate} />
    }
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title={chapterTitle.title}
          subtitle={chapterTitle.subtitle}
          icon={chapterTitle.icon}
          accent={chapterTitle.accent}
          onBack={currentChapter !== 'index' ? () => handleNavigate('index') : undefined}
          onPanelToggle={currentChapter !== 'index' ? togglePanel : undefined}
          isPanelOpen={isPanelOpen}
        />
      }
      navigation={
        <BottomControls
          currentChapter={currentChapter}
          onNavigate={handleNavigate}
        />
      }
    >
      <Suspense fallback={<div className="chapter-loading">正在准备实验场…</div>}>
        {renderChapter()}
      </Suspense>
    </AppShell>
  )
}
