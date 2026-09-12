---
marp: true
theme: default
paginate: true
size: 16:9
title: PIMSathon G5 — AI Project Management Platform
---

<!-- Ghi chú: File này viết theo cú pháp Marp (https://marp.app/).
Mỗi slide cách nhau bởi dòng "---".
Có thể mở trực tiếp bằng VS Code + extension "Marp for VS Code" để xem/preview/export PDF & PPTX,
hoặc dùng làm outline để paste vào Google Slides / PowerPoint. -->

# PIMSathon G5

## Nền tảng Quản lý Dự án được tăng tốc bởi AI & Tự động hoá Workflow

**Team G5**
_Ngày trình bày: **/**/2026_

---

## 1. Vấn đề (Problem)

PM team hiện tại đang gặp:

- 🔀 **Dữ liệu phân mảnh**: Jira, GitHub, Slack, Teams, Outlook, Gmail — mỗi nơi một mảnh thông tin
- 🕵️ **Thiếu minh bạch**: không biết trạng thái Jira có khớp với thực tế trên git hay không
- 🐢 **Việc lặp đi lặp lại thủ công**: sync trạng thái, tạo report, cảnh báo rủi ro cycle/module
- 🤖 **AI chưa được tận dụng**: review code, xác minh tiến độ, trả lời câu hỏi nghiệp vụ vẫn làm tay

> Câu hỏi đặt ra: _Làm sao để một PM chỉ cần nhìn 1 chỗ, mà vẫn tin tưởng dữ liệu, và để máy tự làm phần việc lặp lại?_

---

## 2. Giải pháp (Solution)

Một **monorepo** kết hợp 3 trụ cột:

1. **Admin UI** — trung tâm quản lý Work Item / Project / Integrations / Settings
2. **Workflow Engine (n8n-clone)** — automation builder kéo-thả, chạy được thật (không mô phỏng)
3. **AI Agents** — xác minh tiến độ, tìm kiếm code bằng ngôn ngữ tự nhiên, trợ lý phân tích rủi ro

➡️ Kết quả: PM/Dev thấy **một nguồn sự thật duy nhất**, được **AI xác minh**, và **tự động cập nhật**.

---

## 3. Kiến trúc tổng quan

```
apps/
 ├─ admin-ui        → React/Vite shell: Work Items, Projects, Integrations, Settings
 └─ backend         → Fastify + Drizzle + Postgres (submodule)

packages/
 ├─ workflow-core   → Node registry (~30 node), execution engine, WorkflowRuntime
 ├─ workflow-ui     → React Flow canvas — clone UI/UX của n8n
 ├─ workflow-db     → Drizzle schema + migrations (Postgres)
 └─ design-system   → UI kit dùng chung (Storybook)
```

**Nguyên tắc thiết kế:** workflow-core "vue-free", tách UI khỏi engine → tái sử dụng được ở bất kỳ frontend nào.

---

## 4. Tính năng nổi bật #1 — Workflow Automation (n8n clone)

- Canvas kéo-thả bằng **React Flow**, đối chiếu pixel/interaction với n8n thật
- ~30 node type: **AI · App · Platform · Data · Flow · Core · Human Review**
- Node Detail Modal (NDV) 3 cột: Input / Parameters / Output
- Validate cấu hình node theo thời gian thực (cảnh báo tam giác, banner lỗi)
- Thực thi **thật trên server** qua `WorkflowRuntime` — không phải giả lập trong trình duyệt
- Danh sách node & logic chạy đều lấy từ backend, không bundle cứng ở client

---

## 4.1 Screenshot — Workflow Editor

![w:950](./screenshots/04-workflow-editor.png)

<!-- 📸 Chèn ảnh: canvas kéo-thả + Node Detail Modal (NDV) 3 cột Input/Parameters/Output.
File: docs/screenshots/04-workflow-editor.png -->

---

## 5. Tính năng nổi bật #2 — Tích hợp hệ sinh thái làm việc

**Integrations (Settings → Integrations):**

| Provider                        | Vai trò                                              |
| ------------------------------- | ---------------------------------------------------- |
| Jira                            | Đồng bộ 2 chiều, lưu full raw issue                  |
| GitHub                          | Local Git hoặc GitHub remote — người dùng chọn nguồn |
| Slack / Teams / Outlook / Gmail | Gửi thông báo / cảnh báo tự động                     |

- Credential được **mã hoá AES-256-GCM**, không bao giờ trả secret ra client
- Test connection realtime cho từng provider

---

## 5.1 Screenshot — Integrations

![w:950](./screenshots/05-integrations.png)

<!-- 📸 Chèn ảnh: màn hình Settings → Integrations (danh sách Jira/GitHub/Slack/Teams/Outlook/Gmail).
File: docs/screenshots/05-integrations.png -->

---

## 6. Tính năng nổi bật #3 — AI Agents "biết đọc code thật"

- **AI Agent node**: gọi LLM thật (không còn stub) qua **LLM Configs** do người dùng tự khai báo (provider/model/temperature/...)
- **Git node**: đọc nội dung file thật từ source (Local hoặc GitHub) để AI có ngữ cảnh
- **Code Search**: embedding vector, chọn model embedding từ LLM Config, verify với FPT AI Factory multilingual-e5-large
- **Work Item Authenticity Agent**: ReAct agent (`git grep` + đọc file) tự **đối chiếu trạng thái Jira với source code thật**, cache lại các file liên quan làm bằng chứng (`aiNote`)

➡️ AI không "đoán" — AI **tự đi kiểm chứng** trên dữ liệu thật.

---

## 6.1 Screenshot — AI xác minh tiến độ

![w:950](./screenshots/06-ai-agent-verify.png)

<!-- 📸 Chèn ảnh: Work Item Authenticity Agent đang chạy (git grep + kết luận), hoặc AI Agent node trong workflow.
File: docs/screenshots/06-ai-agent-verify.png -->

---

## 7. Tính năng nổi bật #4 — Quản lý Work Item toàn diện

- Work Item gắn với **Development tab**: chọn nguồn Git (Local hoặc GitHub) mặc định
- So sánh trạng thái Jira ⟷ nhánh git thực tế (workflow "kiểm tra work item vs local git branch")
- Thiết kế **9 workflow tự động hoá theo từng work item** (WI-01..09): sync, webhook realtime, phân tích rủi ro Cycle/Module với schema JSON chuẩn hoá (`healthScore`, `risks[]`, `recommendedActions[]`, `needsAlert`...)

---

## 7.1 Screenshot — Work Item Detail

![w:950](./screenshots/07-work-item.png)

<!-- 📸 Chèn ảnh: Work Item detail, tab Development (chọn Git source) hoặc tab Automation.
File: docs/screenshots/07-work-item.png -->

---

## 8. Tính năng nổi bật #5 — Quản lý Sprint & Module

- **Sprint (Cycle)**: cửa sổ làm việc có start/end date, tự tính **% hoàn thành**, số item **overdue**, breakdown theo status/priority
- **Module**: nhóm work item theo hạng mục/tính năng — 1 work item có thể thuộc **nhiều module cùng lúc**
- Mỗi Sprint/Module có **trang chi tiết riêng** (danh sách work item, tiến độ, deep-link `?sprint=`/`?module=`)
- Dữ liệu này nuôi trực tiếp **Cycle progress**, **Milestones**, **Velocity trend** trên Project Health

---

## 8.1 Screenshot — Sprints & Modules

![w:950](./screenshots/08-sprints-modules.png)

<!-- 📸 Chèn ảnh: màn hình danh sách Sprints hoặc Modules, kèm 1 trang chi tiết sprint/module.
File: docs/screenshots/08-sprints-modules.png -->

---

## 9. Tính năng nổi bật #6 — Project Health Dashboard

Một màn hình tổng hợp **real-time từ dữ liệu thật** của project:

- **Team workload**, **Bugs theo status/priority**, **Milestones & Cycle progress** (thanh tiến độ, cảnh báo "At risk")
- **Velocity trend**: story point hoàn thành theo từng cycle đã kết thúc
- **Dev activity**: PR đang mở/đã merge, số commit 7 ngày gần nhất (biểu đồ theo ngày)
- **AI health rollup**: điểm sức khoẻ, risk, recommended actions — lấy từ kết quả workflow Analyze Cycle/Module
- **Alerts**: cảnh báo do Alert Engine workflow tạo ra cho project

---

## 9.1 Screenshot — Project Health

![w:950](./screenshots/09-project-health.png)

<!-- 📸 Chèn ảnh: toàn bộ Project Health dashboard (workload, velocity, dev activity, AI health rollup).
File: docs/screenshots/09-project-health.png -->

---

## 10. Tính năng nổi bật #7 — Quản lý AI Agent & Tools

- **AI Agent**: một system prompt viết bằng Markdown, gắn với **1 LLM Config**, chọn các **Tools** được phép gọi, giới hạn số vòng gọi tool tối đa
- **Agent Tools**: hàm **JavaScript** tự viết + **JSON Schema** mô tả tham số, có nút **Run** để test độc lập ngay trong UI trước khi gán cho agent
- Dùng trong workflow qua node **"Send Message to Agent"** — chọn agent từ dropdown, không cần cấu hình lại
- Tool-calling loop chạy **thật** trên OpenAI / Anthropic / Azure OpenAI / OpenAI-compatible

---

## 10.1 Screenshot — AI Agents & Tools

![w:950](./screenshots/10-ai-agents-tools.png)

<!-- 📸 Chèn ảnh: Settings → AI Agents (danh sách/edit form) và Settings → Tools (form + nút Run test).
File: docs/screenshots/10-ai-agents-tools.png -->

---

## 11. Tech Stack

- **Frontend:** React, Vite, React Flow (@xyflow/react), TypeScript
- **Backend:** Fastify, Drizzle ORM, PostgreSQL
- **Monorepo tooling:** Turborepo, pnpm workspaces
- **AI/LLM:** Cấu hình LLM linh hoạt (multi-provider), vector embedding cho Code Search
- **Bảo mật:** AES-256-GCM mã hoá credential tích hợp
- **Testing:** Vitest, Playwright (e2e)

---

## 12. Demo Flow (gợi ý trình bày trực tiếp)

1. Mở **Work Item** → tab Automation → chọn workflow áp dụng
2. Mở **Workflow Editor** → dựng nhanh 1 flow: Trigger → AI Agent → Update Work Item
3. Bấm **Run** → xem log 3 cột Input/Parameters/Output chạy thật
4. Vào **Sprints/Modules** → tạo 1 sprint, gán work item, xem % tiến độ tự cập nhật
5. Vào **Health** → xem workload, velocity trend, dev activity và AI health rollup của cùng project đó
6. Vào **Settings → AI Agents / Tools** → tạo nhanh 1 tool JS, gán vào agent, bấm **Run** để test tool
7. Vào **Settings → Integrations** → test connection Jira/Slack
8. Chạy **Work Item Authenticity Agent** → cho thấy AI tự grep code và kết luận

---

## 13. Roadmap tiếp theo

- [ ] `workItemTrigger` node thật (hiện đang dùng Webhook Jira/GitHub thay thế)
- [ ] Webhook node nhận payload thật (hiện còn mô phỏng)
- [ ] Node "Execute Sub-Workflow" để chain các workflow với nhau
- [ ] Scheduler/cron theo từng project
- [ ] Story point / estimate field cho `PlatformWorkItem` → burndown/velocity thật

_(Theo dõi chi tiết tại `docs/pm-workitem-workflows.md` và checklist n8n-clone gap tracker)_

---

## 14. Kết luận

**PIMSathon G5** biến việc quản lý dự án từ _nhập liệu & đoán trạng thái_ thành:

> **Một nền tảng nơi automation chạy thật, tích hợp thật, và AI tự kiểm chứng thật.**

### Cảm ơn đã lắng nghe! 🙌

Q&A
