---
id: TEST-COMMAND-2
time: 00:02
description: CommandLine 功能测试 - jump 和 end
loop: TEST
---
narration
--- 测试 4: jump (通过 time) ---

dialogue
准备跳转到时间 00:00 的片段...

command
jump 00:00

narration
{red}注意：如果看到这条消息，说明 jump 命令没有正确执行。{/red}
