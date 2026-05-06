---
id: TEST-COMMAND
time: 00:01
description: CommandLine 功能测试
loop: TEST
---
narration
这是一个测试场景，用于验证 CommandLine 功能。

dialogue
我们将测试各种命令：setFlag、unsetFlag、jump 和 end。

narration
--- 测试 1: setFlag ---

command
setFlag test_flag_1

dialogue
已设置 flag: test_flag_1

narration
--- 测试 2: unsetFlag ---

command
setFlag test_flag_2

command
unsetFlag test_flag_2

dialogue
已设置并取消 flag: test_flag_2

narration
--- 测试 3: jump (通过 segmentId) ---

dialogue
准备跳转到 TEST-CHOICE 片段...

command
jump TEST-CHOICE

narration
{red}注意：如果看到这条消息，说明 jump 命令没有正确执行。{/red}
