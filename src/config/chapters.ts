import type { IconName } from '../components/ui/Icon'

export type ChapterKey =
  | 'index'
  | 'ch1'
  | 'ch2'
  | 'ch3'
  | 'ch4'
  | 'ch5'
  | 'ch6'
  | 'ch7'
  | 'ch8'
  | 'ch9'
  | 'ch10'

export interface ChapterMeta {
  key: Exclude<ChapterKey, 'index'>
  number: string
  title: string
  englishTitle: string
  shortTitle: string
  subtitle: string
  description: string
  category: '基础' | '积分' | '微分' | '物理' | '流体' | '三维'
  icon: IconName
  accent: string
  recommendedPreset?: string
}

export const CHAPTERS: ChapterMeta[] = [
  {
    key: 'ch1',
    number: '01',
    title: '向量场入门',
    englishTitle: 'Vector Field',
    shortTitle: '向量场',
    subtitle: '从位置到方向与强度',
    description: '用箭头、场线和示踪粒子观察同一个向量场，建立最基本的空间直觉。',
    category: '基础',
    icon: 'vector',
    accent: '#59f2c3',
    recommendedPreset: 'constant',
  },
  {
    key: 'ch2',
    number: '02',
    title: '通量',
    englishTitle: 'Flux',
    shortTitle: '通量',
    subtitle: '场穿过曲线的净程度',
    description: '编辑一条有方向的曲线，观察每一小段的法向分量如何累加成通量。',
    category: '积分',
    icon: 'flux',
    accent: '#47c8ff',
    recommendedPreset: 'constant',
  },
  {
    key: 'ch3',
    number: '03',
    title: '环量',
    englishTitle: 'Circulation',
    shortTitle: '环量',
    subtitle: '场沿回路推动的总趋势',
    description: '拖动闭合回路，对比旋转场与无旋场中切向分量和环量的差异。',
    category: '积分',
    icon: 'circulation',
    accent: '#f7c86a',
    recommendedPreset: 'rotational',
  },
  {
    key: 'ch4',
    number: '04',
    title: '散度',
    englishTitle: 'Divergence',
    shortTitle: '散度',
    subtitle: '局部的源、汇与净流出',
    description: '把探针放到场中，结合热力图和局部通量理解散度的物理含义。',
    category: '微分',
    icon: 'divergence',
    accent: '#ff7b8f',
    recommendedPreset: 'source',
  },
  {
    key: 'ch5',
    number: '05',
    title: '旋度',
    englishTitle: 'Curl',
    shortTitle: '旋度',
    subtitle: '局部旋转与小桨轮',
    description: '用可移动桨轮和旋度热力图判断场在一点附近是否存在净旋转，并区分整体绕行与局部自转。',
    category: '微分',
    icon: 'curl',
    accent: '#a98bff',
    recommendedPreset: 'rotational',
  },
  {
    key: 'ch6',
    number: '06',
    title: '二维电场',
    englishTitle: 'Electric Field',
    shortTitle: '电场',
    subtitle: '点电荷叠加与二维高斯定理',
    description: '拖动、添加或删除点电荷，用闭合曲线验证二维静电场中的高斯关系。',
    category: '物理',
    icon: 'electric',
    accent: '#ff9f5a',
  },
  {
    key: 'ch7',
    number: '07',
    title: '磁场与感应',
    englishTitle: 'Magnetic Field',
    shortTitle: '磁场',
    subtitle: '载流导线与法拉第电磁感应',
    description: '观察载流直导线周围的磁场，并用楞次定律判断感应电场方向。',
    category: '物理',
    icon: 'magnetic',
    accent: '#ff6fa9',
  },
  {
    key: 'ch8',
    number: '08',
    title: '液态流体',
    englishTitle: 'Water Flow',
    shortTitle: '水流',
    subtitle: '不可压缩、剪切与涡旋',
    description: '用染料粒子、小圆通量和旋度读数理解水流：可以流动和绕行，但净通量常接近零。',
    category: '流体',
    icon: 'water',
    accent: '#7dd3fc',
  },
  {
    key: 'ch9',
    number: '09',
    title: '气体流动',
    englishTitle: 'Gas Flow',
    shortTitle: '气体',
    subtitle: '膨胀、压缩与密度直觉',
    description: '对比气体的源、汇、背景风和旋流，观察散度如何对应膨胀、压缩和净流出。',
    category: '流体',
    icon: 'gas',
    accent: '#ffbf70',
  },
  {
    key: 'ch10',
    number: '10',
    title: '三维投影',
    englishTitle: '3D Projection',
    shortTitle: '3D投影',
    subtitle: '自定义函数投影到二维平面',
    description: '输入 3D 标量或向量函数，在倾斜平面上观察梯度、投影场、散度和通量。',
    category: '三维',
    icon: 'projection',
    accent: '#b8f06a',
  },
]

export const CHAPTER_MAP: Record<ChapterKey, {
  title: string
  subtitle: string
  icon: IconName
  accent: string
}> = {
  index: {
    title: '实验目录',
    subtitle: '选择一个主题开始探索',
    icon: 'home',
    accent: '#59f2c3',
  },
  ...Object.fromEntries(
    CHAPTERS.map((chapter) => [
      chapter.key,
      {
        title: `${chapter.title} · ${chapter.englishTitle}`,
        subtitle: `第 ${chapter.number} 章 · ${chapter.subtitle}`,
        icon: chapter.icon,
        accent: chapter.accent,
      },
    ])
  ) as Record<Exclude<ChapterKey, 'index'>, {
    title: string
    subtitle: string
    icon: IconName
    accent: string
  }>,
}
