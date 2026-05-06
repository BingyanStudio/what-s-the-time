---
id: TEST-CHOICE
time: 00:00
description: ChoiceLine 功能测试
loop: TEST
---
narration
这是一个测试场景，用于验证 ChoiceLine 功能。

dialogue
请做出你的选择：

choice
- [选项 A：继续前进](#1)
- [选项 B：停下来思考](#2)
- [选项 C：返回](#3)


narration
测试完成。你可以尝试不同的选项来查看效果。

command
jump START


# 1
narration
你选择了继续前进。

dialogue
前方有什么在等待着你...

dialogue
旁白:
这是一个测试选项 A 的后续内容。


# 2
narration
你停下来，开始思考。

dialogue
有时候，**停下来**比盲目前进更重要。

dialogue
内心:
这个选择会带来不同的结果...


# 3
narration
你决定返回。

dialogue
{red}有时候，回头看看也是必要的。{/red}

dialogue
系统:
这个选项测试了格式标记和角色名显示。


