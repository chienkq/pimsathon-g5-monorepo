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

## 6. Tính năng nổi bật #3 — AI Agents "biết đọc code thật"

- **AI Agent node**: gọi LLM thật (không còn stub) qua **LLM Configs** do người dùng tự khai báo (provider/model/temperature/...)
- **Git node**: đọc nội dung file thật từ source (Local hoặc GitHub) để AI có ngữ cảnh
- **Code Search**: embedding vector, chọn model embedding từ LLM Config, verify với FPT AI Factory multilingual-e5-large
- **Work Item Authenticity Agent**: ReAct agent (`git grep` + đọc file) tự **đối chiếu trạng thái Jira với source code thật**, cache lại các file liên quan làm bằng chứng (`aiNote`)

➡️ AI không "đoán" — AI **tự đi kiểm chứng** trên dữ liệu thật.

---

## 7. Tính năng nổi bật #4 — Quản lý Work Item toàn diện

- Work Item gắn với **Development tab**: chọn nguồn Git (Local hoặc GitHub) mặc định
- So sánh trạng thái Jira ⟷ nhánh git thực tế (workflow "kiểm tra work item vs local git branch")
- Thiết kế **9 workflow tự động hoá theo từng work item** (WI-01..09): sync, webhook realtime, phân tích rủi ro Cycle/Module với schema JSON chuẩn hoá (`healthScore`, `risks[]`, `recommendedActions[]`, `needsAlert`...)

---

## 8. Tech Stack

- **Frontend:** React, Vite, React Flow (@xyflow/react), TypeScript
- **Backend:** Fastify, Drizzle ORM, PostgreSQL
- **Monorepo tooling:** Turborepo, pnpm workspaces
- **AI/LLM:** Cấu hình LLM linh hoạt (multi-provider), vector embedding cho Code Search
- **Bảo mật:** AES-256-GCM mã hoá credential tích hợp
- **Testing:** Vitest, Playwright (e2e)

---

## 9. Demo Flow (gợi ý trình bày trực tiếp)

1. Mở **Work Item** → tab Automation → chọn workflow áp dụng
2. Mở **Workflow Editor** → dựng nhanh 1 flow: Trigger → AI Agent → Update Work Item
3. Bấm **Run** → xem log 3 cột Input/Parameters/Output chạy thật
4. Vào **Settings → Integrations** → test connection Jira/Slack
5. Chạy **Work Item Authenticity Agent** → cho thấy AI tự grep code và kết luận

---

## 10. Roadmap tiếp theo

- [ ] `workItemTrigger` node thật (hiện đang dùng Webhook Jira/GitHub thay thế)
- [ ] Webhook node nhận payload thật (hiện còn mô phỏng)
- [ ] Node "Execute Sub-Workflow" để chain các workflow với nhau
- [ ] Scheduler/cron theo từng project
- [ ] Story point / estimate field cho `PlatformWorkItem` → burndown/velocity thật

_(Theo dõi chi tiết tại `docs/pm-workitem-workflows.md` và checklist n8n-clone gap tracker)_

---

## 11. Kết luận

**PIMSathon G5** biến việc quản lý dự án từ _nhập liệu & đoán trạng thái_ thành:

> **Một nền tảng nơi automation chạy thật, tích hợp thật, và AI tự kiểm chứng thật.**

### Cảm ơn đã lắng nghe! 🙌

Q&A
