# Agent Note: Web Chat 消息导航是纯 slot 贡献

Status: implemented

[English](2026-08-18-web-message-navigator.md) | 中文

## Problem

较长的 Chat 文本记录需要一种紧凑方式来识别已发送的消息并返回对应位置，同时不能添加另一套文本记录投影、持久化偏好或会话事件。

## Decision

`@deepseek-ai/dsh-client-ui-message-navigator` 占用由 `ui-conversation` 放置在活动 view 旁的可选会话作用域 `conversation.session.navigator` slot。它读取现有的 `ConversationSnapshot.chat` 顺序和稳定的 Chat 行 key，包含已完成的 `user` 与 `steering` 节点，并在其他 view 为活动状态时保持缺席。

每个导航项始终渲染其 16px 视觉锚点。悬停或键盘聚焦时，会增加一个以该锚点为中心对齐的左侧气泡；首尾项会将气泡约束到列表内部以保持可见；它会拼接文本块、规范化空白，并在截断时将 24 个 Unicode 代码点及 `......` 放入每行 15 个字符的两行中。组件从 Chat 滚动区的用户行锚点派生选中的 key，并将被点击的行移动到相同的阅读偏移量。悬停与选中都保持为组件局部状态。

该包不拥有服务、store、持久事件或模型可见内容。chat view 仍然持有文本记录顺序、锚点、分页和滚动跟随行为。

## Alternatives considered

**将导航加入 `ui-conversation`。** 不采用，因为它是可选的仅 Chat chrome，不含会话领域行为；消费者插件可以被组合移除，无需变更外壳。

**持久化导航选中项。** 不采用，因为选中项表示当前视口且必须立即跟随滚动；恢复它会与 Chat 现有的阅读位置恢复发生冲突。

**从第二个会话日志投影构建导航项。** 不采用，因为现有 Chat 快照和稳定锚点已经包含所需的可见行，而并行投影会重复顺序和分页归属。

## Consequences

Web 组合包通过其客户端 roster 默认启用导航。组件测试固定摘要限制、悬停行为、滚动选中、点击导航和非 Chat 状态下的缺席；组装后的 Web 启动测试证明构建后的客户端插件加入生产图。导航只覆盖当前已加载的 Chat 历史，且仅含图片的消息没有可见摘要文本。
