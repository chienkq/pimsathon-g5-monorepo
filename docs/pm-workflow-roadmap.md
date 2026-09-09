# 5 Trụ Cột Workflow — PM Platform

Tổng hợp từ ghi chú lập kế hoạch dự án Project Manager. Mỗi trụ cột là một nhóm workflow, mỗi workflow được rã thành các nhiệm vụ (task) cụ thể. Các mục còn để ngỏ trong ghi chú gốc được giữ nguyên là **cần định nghĩa thêm**, không tự suy diễn thay BTC/PO.

**Chú thích trạng thái:** ✅ đã rõ nhiệm vụ · 🟠 cần định nghĩa thêm

**Tổng quan:** 5 trụ cột · 19 workflow đề xuất · 7 workflow cần định nghĩa thêm · 7 tiêu chí Agent Ops

---

## 01 · Data Integration

Các workflow đưa dữ liệu từ hệ thống bên ngoài (quản lý công việc, mã nguồn, CI/CD, tri thức nội bộ) vào nền tảng PM.

### WF-01 — Kết nối Jira ✅

- Xác thực API Jira (OAuth 2.0 / API token) theo từng project
- Đồng bộ issues, epics, sprints, trạng thái workflow
- Webhook nhận sự kiện cập nhật realtime (issue changed, sprint started/closed)
- Mapping trường dữ liệu Jira ↔ mô hình dữ liệu nội bộ (work item, sprint, assignee)

### WF-02 — Kết nối Git ✅

- Xác thực GitHub/GitLab (App/PAT) theo repo
- Đồng bộ commits, pull requests, branches
- Webhook sự kiện push / merge / review
- Liên kết commit ↔ Jira issue (theo mã issue trong message/branch)

### WF-03 — Setup CI/CD ✅

- Kết nối pipeline (GitHub Actions / GitLab CI / Jenkins)
- Thu thập trạng thái build / test / deploy theo từng run
- Webhook kết quả pipeline về nền tảng PM

### WF-04 — Kết nối Knowledge Base – Sovlyce ✅

- Xác thực API Sovlyce
- Đồng bộ tài liệu / tri thức nội bộ
- Index nội dung để AI truy vấn (dùng cho Root Cause Analysis, Action Recommends...)

### WF-05 — Nguồn tích hợp bổ sung 🟠

> Ghi chú gốc: "Còn nữa" — chưa xác định thêm hệ thống nào cần kết nối ngoài Jira / Git / CI-CD / Sovlyce.

---

## 02 · Project Health Dashboard

Dữ liệu đã đồng bộ ở trụ cột 1 được tổng hợp thành các biểu đồ/chỉ số sức khỏe dự án.

### WF-06 — Sprint Progress Chart ✅

- Biểu đồ tiến độ sprint (burndown/burnup) theo dữ liệu Jira đã đồng bộ

### WF-07 — Team Workload Chart ✅

- Biểu đồ khối lượng công việc theo từng thành viên/team

### WF-08 — Bugs Chart ✅

- Biểu đồ số lượng/mức độ bug theo thời gian, theo trạng thái

### WF-09 — Milestone Chart ✅

- Biểu đồ mốc tiến độ (milestone) dự án

### WF-10 — Alert List ✅

- Danh sách cảnh báo (alert) hiển thị dạng list trên dashboard

### WF-11 — Plan vs Actual 🟠

> Ghi chú gốc: Chưa hiểu rõ BTC muốn thể hiện thông tin gì trong so sánh Kế hoạch vs Thực tế (theo tiến độ? theo effort? theo ngân sách?).

---

## 03 · AI Project Intelligence

Các workflow dùng AI (FPT AI) để phân tích và dự báo dựa trên dữ liệu đã đồng bộ.

### WF-12 — Kết nối FPT AI ✅

- Xác thực API FPT AI
- Thiết lập model/endpoint sử dụng cho từng workflow AI bên dưới
- Theo dõi rate limit / chi phí gọi API

### WF-13 — Analyze Root Cause ✅

- Thu thập input: Jira task liên quan + source code thay đổi
- Xây pipeline/prompt phân tích nguyên nhân gốc (root cause) cho bug/incident
- Trả kết quả phân tích kèm bằng chứng (task/commit liên quan)

### WF-14 — Analyze Bug Trend 🟠

> Ghi chú gốc: Đang chưa có ý tưởng cụ thể cho phân tích xu hướng bug.

### WF-15 — Dự báo Sprint 🟠

> Ghi chú gốc: Chưa biết dùng thông số gì để đưa cho AI dự báo (velocity? scope creep? % hoàn thành?).

### WF-16 — ETA Project 🟠

> Ghi chú gốc: Cần định nghĩa các thông số đầu vào gửi cho AI để ước tính ngày hoàn thành dự án.

### WF-17 — Action Recommends 🟠

> Ghi chú gốc: Cần định nghĩa nguồn input cho AI trước khi thiết kế workflow gợi ý hành động.

---

## 04 · Code Intelligence (Metis)

Tích hợp công cụ phân tích mã nguồn Metis vào nền tảng.

### WF-18 — Tích hợp Metis vào dự án ✅

- Kết nối/nhúng Metis vào pipeline hoặc dashboard của nền tảng

### WF-19 — Nghiên cứu tính năng Metis ✅

- Tìm hiểu toàn bộ tính năng Metis để xác định cách tích hợp phù hợp nhất với sản phẩm

---

## 05 · AI Architecture & Agent Ops

Không phải một workflow đơn lẻ mà là **khung đánh giá xuyên suốt dự án**: mức độ hệ thống AI Agent được kiến trúc, vận hành và áp dụng đúng cách. 7 tiêu chí dưới đây dùng để tự đánh giá liên tục trong suốt vòng đời dự án.

1. **Kiến trúc và guardrail** — Mức độ hệ thống có quy tắc, giới hạn và kiểm tra tự động để đảm bảo AI Agent làm đúng kiến trúc, convention và phạm vi cho phép.
2. **Công cụ và vòng phản hồi** — AI Agent có truy cập công cụ cần thiết và nhận phản hồi nhanh hay không: lỗi lint, test, build, cảnh báo hệ thống.
3. **Tài liệu và tri thức** — Chất lượng tài liệu, context, guideline và kiến thức nội bộ mà Agent có thể dùng để hiểu codebase và ra quyết định chính xác.
4. **Lập kế hoạch và định hướng** — Cách công việc được chia nhỏ, mô tả, ưu tiên và giao cho Agent trước khi thực thi, tránh làm sai yêu cầu hoặc lệch mục tiêu.
5. **Chất lượng và review** — Khả năng kiểm thử, review, xác minh và kiểm soát chất lượng đầu ra do Agent tạo ra trước khi đưa vào production.
6. **Điều phối và mở rộng** — Cách tổ chức quản lý nhiều agent, nhiều phiên làm việc, trạng thái, nhật ký hoạt động và khả năng mở rộng trong quy trình phát triển.
7. **Văn hóa và mức độ áp dụng** — Mức độ đội ngũ hiểu, chấp nhận và dùng AI Agent hiệu quả, bao gồm sự chuyển vai trò kỹ sư từ trực tiếp làm sang định hướng, giám sát và đánh giá agent.

---

_Bản online (có UI trực quan hơn): https://claude.ai/code/artifact/0d0e1bdb-12a0-4dc8-b7d0-f8bab3f6fbae_
