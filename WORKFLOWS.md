# PM Workflow Blueprint & Roadmap

**Trạng thái file này: mới tạo — trước đây không có file nào lưu lộ trình/blueprint W1-W27.**
Toàn bộ thiết kế trước giờ chỉ tồn tại trong hội thoại Claude Code, không có ở đâu trong repo. File
này là lần đầu ghi lại, dựng lại từ (a) code thật đang có trong `apps/backend/src/seedWorkflow.ts`
(chắc chắn, đã verify) và (b) trí nhớ hội thoại về phần chưa build (**có thể thiếu hoặc sai** —
đánh dấu rõ bên dưới, cần bạn xác nhận/bổ sung).

Cập nhật file này mỗi khi có workflow mới được thiết kế hoặc build — đừng để lại rơi vào tình trạng
"chỉ tồn tại trong hội thoại" như trước.

## Lộ trình "fast track" đã đề xuất

> W1 → W7 → W11 → W13

Thực tế build KHÔNG theo đúng thứ tự này — build theo nhu cầu phát sinh trong hội thoại:
**W1 → W8 → W9 → W10 → W11 → W3 → (Cycles/Modules, Project Health — không phải "W" riêng, xem bên dưới)**.
W7 và W13 trong lộ trình fast-track **chưa build**.

## Đã build (verified từ code — `apps/backend/src/seedWorkflow.ts`)

| ID  | Tên               | File / function                   | Đọc dữ liệu từ                                 | Ghi chú                                                                                  |
| --- | ----------------- | --------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| W1  | Jira Sync         | `buildJiraSyncWorkflow()`         | Jira thật (hoặc fake-jira mock server)         | Cron `*/15 * * * *`, connector `jira`                                                    |
| W3  | GitHub Sync       | `buildGitHubSyncWorkflow()`       | GitHub API thật (`chienkq/pimsathon-backend`)  | Cron `*/15 * * * *`, connector `github`, chỉ đọc — chưa bật ghi (Create Issue/Branch/PR) |
| W8  | Team Workload     | `buildTeamWorkloadWorkflow()`     | `work_items` (Postgres)                        | Publish widget `team-workload`                                                           |
| W9  | Bug Metrics       | `buildBugMetricsWorkflow()`       | `work_items` (label "bug")                     | Publish widget `bugs-by-status` + `bugs-by-priority`                                     |
| W10 | Milestone Tracker | `buildMilestoneTrackerWorkflow()` | `planning_groups` (kind=module) + `work_items` | Publish widget `milestones`, raise alert `milestone-at-risk`                             |
| W11 | Alert Engine      | `buildAlertEngineWorkflow()`      | `work_items`                                   | Raise alert `stale-urgent-item`                                                          |

Tất cả 6 workflow trên đăng ký trong `apps/backend/src/index.ts`'s `registeredWorkflows`, chạy được
qua `POST /api/workflows/:id/run`, đã test thật (không phải chỉ type-check).

## Không phải "workflow" nhưng phục vụ cùng mục đích (build trực tiếp ở backend, không qua workflow engine)

| Tính năng                                                              | File                                                                           | Vì sao không phải workflow                                                                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project Health Dashboard (per-project)                                 | `apps/backend/src/projectHealth.ts`                                            | Cần tính **live, per-project** — nếu là workflow (như W8-W10) thì phải chờ tới lần chạy theo lịch tiếp theo mới cập nhật; ở đây tính trực tiếp mỗi lần gọi API |
| admin-ui ↔ backend sync (Work Items, Cycles/Modules, Projects/Members) | `apps/backend/src/adminUiSync.ts`, `workItemStore.ts`, `planningGroupStore.ts` | Đây là REST CRUD 2 chiều với admin-ui, không phải pipeline 1 chiều kiểu workflow                                                                               |

## Đã thảo luận nhưng CHƯA build — độ tin cậy: trung bình, cần bạn xác nhận lại

Đây là phần tôi nhớ được từ hội thoại, **không đảm bảo đầy đủ hoặc chính xác 100%** vì có thể đã bị
mất qua các lần nén context:

| ID     | Tên (theo trí nhớ)                                                                                                                              | Lý do chưa build                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| W7     | Sprint Progress (burndown)                                                                                                                      | Cần snapshot lịch sử (baselineSnapshot) — chưa có cơ chế lưu snapshot theo thời gian |
| W12    | Plan vs Actual                                                                                                                                  | Cùng lý do — cần baselineSnapshot                                                    |
| W13    | AI / Root-cause analysis (RCA)                                                                                                                  | Chưa thiết kế cụ thể node/luồng                                                      |
| W17    | Action Recommendations                                                                                                                          | Chưa thiết kế cụ thể                                                                 |
| W18-20 | Metis (nhóm workflow liên quan tới "Metis" — 1 node `metisSoftwareNodeType` đã có sẵn trong `workflow-core` nhưng chưa có workflow nào dùng nó) | Chưa thiết kế cụ thể                                                                 |
| W21-27 | Agent Ops (nhóm workflow vận hành AI agent)                                                                                                     | Chưa thiết kế cụ thể                                                                 |

**Khoảng trống thật sự không chắc chắn**: W2, W4, W5, W6, W14, W15, W16 — tôi **không nhớ được**
nội dung các mục này (nếu từng được định nghĩa). Nếu bạn còn nhớ hoặc có ghi chú riêng ở đâu đó,
xin bổ sung vào bảng trên; nếu không, coi như cần thiết kế lại từ đầu.

## Vì sao chưa có file này trước đây

Tôi không chủ động ghi các quyết định thiết kế (không phải code, không phải feedback trực tiếp từ
bạn) ra file — chỉ dựa vào hội thoại. Với dự án nhiều phiên như thế này, đó là thiếu sót. Từ giờ,
mỗi khi thiết kế 1 workflow mới (kể cả chỉ mới lên ý tưởng, chưa code), tôi sẽ thêm vào bảng "Chưa
build" ở trên trước khi bắt tay code, và chuyển xuống bảng "Đã build" kèm ngày hoàn thành khi xong.
