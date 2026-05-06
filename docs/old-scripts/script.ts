import type { ScriptSegment } from '@/types'

/**
 * 剧本数据
 * 使用 TypeScript 直接定义，支持类型检查和 IDE 自动补全
 * 
 * 格式说明：
 * - DialogueLine: { type: 'dialogue', character?: '角色名', text: '对话内容' }
 * - NarrationLine: { type: 'narration', text: '场景描述' }
 * - ChoiceLine: { type: 'choice', choices: [...] }
 * - 文本格式标记：{red}红色文本{/red} {bold}粗体{/bold} {italic}斜体{/italic} {br}换行
 */
export const scriptSegments: ScriptSegment[] = [
  // Loop A: 完全伪日常
  {
    id: 'P03-01',
    time: '08:05',
    description: '和 B 一起上学（伪恋爱开场）',
    loop: 'A',
    unlockFlags: [],
    lines: [
      {
        type: 'narration',
        text: '早晨的上学路。阳光透过树叶洒下来。'
      },
      {
        type: 'dialogue',
        character: 'B',
        text: '一年前那件事，你现在还好吗？'
      },
      {
        type: 'dialogue',
        text: '我点点头，没有回答。'
      }
    ]
  },
  {
    id: 'P03-02',
    time: '12:10',
    description: '教室午餐·B & D & E 同场',
    loop: 'A',
    unlockFlags: [],
    lines: [
      {
        type: 'narration',
        text: '教室午休时间。'
      },
      {
        type: 'dialogue',
        character: 'B',
        text: '给你，我多带了一份。'
      },
      {
        type: 'dialogue',
        character: 'D',
        text: '你们很配嘛。'
      },
      {
        type: 'narration',
        text: 'E 路过门口，多看了我一眼。'
      }
    ]
  },
  {
    id: 'P03-03',
    time: '18:40',
    description: '垃圾袋 + 锯子（伪日常版）',
    loop: 'A',
    unlockFlags: [],
    lines: [
      {
        type: 'narration',
        text: '我提着垃圾袋，旁边放着锯子。'
      },
      {
        type: 'dialogue',
        text: '家里农活用的工具。'
      }
    ]
  },
  {
    id: 'P03-04',
    time: '23:15',
    description: '夜间独白·软版本',
    loop: 'A',
    unlockFlags: [],
    lines: [
      {
        type: 'narration',
        text: '夜晚。我躺在床上。'
      },
      {
        type: 'dialogue',
        text: '时间过得真快...真慢...时间是...'
      },
      {
        type: 'narration',
        text: '话停住了。'
      }
    ]
  },
  
  // Loop B: B 消失后的日常错位
  {
    id: 'P06-01',
    time: '08:05',
    description: '空路·B 消失',
    loop: 'B',
    unlockFlags: ['loop_a_complete'],
    lines: [
      {
        type: 'narration',
        text: '空荡荡的路。B 不在。'
      },
      {
        type: 'dialogue',
        character: 'D',
        text: '她怎么没来？'
      }
    ]
  },
  {
    id: 'P06-02',
    time: '12:10',
    description: '空座位与便利贴',
    loop: 'B',
    unlockFlags: ['loop_a_complete'],
    lines: [
      {
        type: 'narration',
        text: 'B 的座位空着。桌上留着一张便利贴。'
      },
      {
        type: 'dialogue',
        text: '但我看不清上面写了什么。'
      }
    ]
  },
  
  // Loop C: 假闪回与旧案影子
  {
    id: 'P01-03',
    time: '10:07',
    description: 'A 被推下（假闪回版）',
    loop: 'C',
    unlockFlags: ['loop_b_complete'],
    lines: [
      {
        type: 'narration',
        text: '楼顶。模糊的记忆。'
      },
      {
        type: 'narration',
        text: '她踉跄着，然后...坠落。'
      },
      {
        type: 'dialogue',
        text: '我没拉住她。'
      }
    ]
  },
  {
    id: 'P01-01',
    time: '08:20',
    description: 'A 发约楼顶的消息',
    loop: 'C',
    unlockFlags: ['loop_b_complete'],
    lines: [
      {
        type: 'narration',
        text: '手机屏幕上显示一条消息：'
      },
      {
        type: 'dialogue',
        character: 'A',
        text: '等会儿上去聊聊。'
      },
      {
        type: 'narration',
        text: '时间戳：{bold}08:20{/bold}'
      }
    ]
  },
  
  // 两问一锁：10:07 真相版
  {
    id: 'P01-04',
    time: '10:07',
    secondTime: '08:20',
    description: 'A 被推下（真相版）',
    loop: 'D',
    unlockFlags: ['loop_c_complete', 'saw_p01-01'],
    lines: [
      {
        type: 'narration',
        text: '楼顶。清晰的记忆。'
      },
      {
        type: 'dialogue',
        character: 'A',
        text: '我们分手吧。'
      },
      {
        type: 'narration',
        text: '我抓住她的手腕，有意识地...多推了一点点。'
      }
    ]
  },
  
  // 记忆空白片段（用于未匹配的时间）
  {
    id: 'BLANK',
    time: '*',
    description: '记忆空白',
    loop: '*',
    unlockFlags: [],
    lines: [
      {
        type: 'narration',
        text: '那段时间对我来说，就是一片黑。'
      },
      {
        type: 'dialogue',
        text: '我不想想得太清楚。'
      }
    ]
  }
]

/**
 * 根据时间和条件查找片段
 */
export function findSegment(
  time: string,
  secondTime?: string,
  unlockedFlags: Set<string> = new Set(),
  viewedSegments: Set<string> = new Set()
): ScriptSegment | null {
  // 精确匹配：时间 + 第二问时间
  if (secondTime) {
    const exactMatch = scriptSegments.find(
      seg => seg.time === time && 
             seg.secondTime === secondTime &&
             checkUnlockConditions(seg, unlockedFlags)
    )
    if (exactMatch) return exactMatch
  }
  
  // 时间匹配（无第二问要求）
  const timeMatch = scriptSegments.find(
    seg => seg.time === time && 
           !seg.secondTime &&
           checkUnlockConditions(seg, unlockedFlags)
  )
  if (timeMatch) return timeMatch
  
  // 返回空白片段
  return scriptSegments.find(seg => seg.id === 'BLANK') || null
}

/**
 * 检查解锁条件
 */
function checkUnlockConditions(
  segment: ScriptSegment,
  unlockedFlags: Set<string>
): boolean {
  if (!segment.unlockFlags || segment.unlockFlags.length === 0) {
    return true
  }
  
  return segment.unlockFlags.every(flag => unlockedFlags.has(flag))
}

/**
 * 获取所有可用的时间点（用于提示）
 */
export function getAvailableTimes(
  unlockedFlags: Set<string> = new Set()
): string[] {
  const times = new Set<string>()
  
  scriptSegments.forEach(seg => {
    if (seg.time !== '*' && checkUnlockConditions(seg, unlockedFlags)) {
      times.add(seg.time)
    }
  })
  
  return Array.from(times).sort()
}

