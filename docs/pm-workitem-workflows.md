# Work-Item Workflows — Automation gắn theo từng Work Item

Khác với [pm-workflow-roadmap.md](./pm-workflow-roadmap.md) (workflow cấp hệ thống: đồng bộ dữ liệu, dashboard, AI intelligence tổng quan…), tài liệu này thiết kế các **workflow chạy trên từng work item cụ thể** — input luôn là 1 work item (task/bug/story), trigger được setup ngay trong work item đó, và có thể dùng AI để phân tích nội dung task, code/PR liên quan, v.v.

Các workflow này chạy được trên engine hiện có ở `packages/workflow-core` + editor `packages/workflow-ui` (canvas kiểu n8n). Mỗi thiết kế bên dưới cố gắng map vào node type đã có trong registry hiện tại (nhóm AI / App / Flow / Core / Human Review) để không cần chờ tính năng mới; chỗ nào cần node/khả năng chưa có sẽ ghi rõ **cần bổ sung**.

**Chú thích trạng thái:** ✅ đủ rõ để dựng luôn với node hiện có · 🟠 cần thêm node/khả năng mới (credentials thật, loop cyclic, v.v. — xem gap tracker)

---

## 0 · Mô hình chung: Automation trên Work Item

Mỗi work item có một mục **Automation** (tab/section riêng, tương tự "Rules" của Jira/Linear):

- **Trigger** — sự kiện trên chính work item đó kích hoạt workflow:
  - `on_create` — work item vừa được tạo
  - `on_status_change` — chuyển trạng thái (vd → "In Review", → "Done")
  - `on_assignee_change`
  - `on_comment_added`
  - `on_pr_linked` / `on_pr_opened` / `on_pr_merged` / `on_pr_closed` (yêu cầu WF-02 — Kết nối Git đã đồng bộ dữ liệu PR)
  - `on_field_changed` (priority, due date, story points…)
  - `manual` — người dùng bấm nút "Run workflow" trong work item
- **Workflow được chọn** — 1 dropdown chọn 1 trong các workflow template ở mục 1 bên dưới (hoặc workflow tuỳ biến do PM tự dựng trên canvas, dùng chung engine).
- **Input mặc định truyền vào workflow** — luôn là object work item hiện tại: `{ id, title, description, type, status, priority, assignee, labels, linkedPRs[], commits[], comments[], acceptance_criteria, ... }`. Đây chính là "trigger data" thay cho Manual Trigger/Webhook trigger trong workflow-core thông thường.

**Cần bổ sung (🟠):** hiện `nodeTypes` chỉ có `webhook` là trigger (group `core`). Cần thêm 1 node trigger mới — tạm gọi `workItemTrigger` — nhận sự kiện trên work item làm input, tương tự cách n8n có trigger riêng cho từng app. Việc này nằm ở `packages/workflow-core/src/nodeTypes/` + đăng ký `isTrigger: true`.

Một cách khác (không cần `workItemTrigger` ngay) là để các trigger sự kiện Git/Jira đi qua workflow ở mức hệ thống trước — xem mục 2 "Workflow nền tảng: Sync, Webhook & Phân tích Cycle/Module" bên dưới: workflow `Webhook Jira`/`Webhook GitHub` nhận webhook thật, gọi `workItem`/`planningGroup` để cập nhật, và chính thao tác cập nhật đó mới là thứ kích hoạt các trigger `on_status_change`/`on_pr_*` ở work item — tức 2 tầng workflow này bổ trợ nhau, không thay thế nhau.

---

## 1 · Các workflow đề xuất theo Work Item

### WI-01 — Auto Triage khi tạo task ✅

**Trigger:** `on_create`

- AI (`sendMessageToAiAgent`) đọc title + description, gợi ý: loại việc (bug/feature/chore), priority, estimate (story point/giờ), label phù hợp
- So khớp với các task cũ tương tự (dùng Knowledge Base đã index ở WF-04) để tránh trùng lặp — nếu tìm thấy task giống, comment link vào task cũ
- Ghi kết quả gợi ý dưới dạng comment hoặc field draft (PM/assignee duyệt lại, không tự động ghi đè)

**Node map:** `workItemTrigger`(🟠) → `sendMessageToAiAgent` → `if` (có task trùng?) → `humanReview`/comment output

### WI-02 — PR Review Assistant ✅

**Trigger:** `on_pr_opened` (hoặc `on_pr_linked`)

- Lấy diff của PR liên kết (qua dữ liệu Git đã đồng bộ ở WF-02)
- AI phân tích: code style, rủi ro (thiếu test, thay đổi lớn ở file nhạy cảm), đối chiếu với **acceptance criteria** trong work item xem PR có khớp mô tả yêu cầu không
- Gọi Metis/SonarQube (`metisSoftware`, `sonarQube`) lấy kết quả phân tích tĩnh nếu có
- Tổng hợp thành 1 comment review trên PR hoặc trên work item, gắn cờ cảnh báo nếu lệch acceptance criteria

**Node map:** trigger → `git` (List Pull Requests / List Commits) → `sendMessageToAiAgent` → `metisSoftware`/`sonarQube` (song song, `merge`) → output comment

**Cần bổ sung (🟠):** node `git` (group `app`) đã có sẵn — dùng nó thay cho `httpRequest` thô ở bản thiết kế trước. Nhưng `git` mới hỗ trợ list/create Branches/Commits/PRs/Issues, **chưa có action lấy diff/patch nội dung PR** — vẫn cần `httpRequest` gọi thẳng GitHub API (`/pulls/{n}/files` hoặc `.diff`) cho phần "lấy diff" cụ thể, hoặc bổ sung action "Get Diff" vào node `git`.

### WI-03 — Code Change Impact Analysis ✅

**Trigger:** `on_pr_linked` / `manual`

- Thu thập: commit/PR liên quan tới work item + các work item khác từng chạm cùng file/module (qua git blame + mapping WF-02)
- AI đánh giá mức độ rủi ro thay đổi (số file, module lõi hay không, có test đi kèm không), liệt kê các work item/team có thể bị ảnh hưởng
- Output: risk score + danh sách cảnh báo, hiển thị ngay trên work item; nếu risk cao có thể `raiseAlert` luôn

**Node map:** trigger → `git` (List Commits) + `httpRequest` (git blame, `git` node chưa có action này) → `sendMessageToAiAgent` → `workItem` (Update, ghi field risk) → `if` (risk cao?) → `raiseAlert`

### WI-04 — Root Cause Analysis cho Bug (per work item) ✅

Bản thu hẹp phạm vi của WF-13 (vốn là workflow hệ thống), chạy trực tiếp trên 1 bug cụ thể.

**Trigger:** `manual` (PM/dev bấm "Phân tích nguyên nhân" trên bug) hoặc `on_status_change → "Investigating"`

- Input: mô tả bug + log/stacktrace đính kèm (nếu có) + commit gần nhất chạm vào vùng code liên quan
- AI phân tích nguyên nhân gốc, trả về kèm bằng chứng (commit/file cụ thể), tương tự WF-13 nhưng scope = 1 work item thay vì quét toàn dự án
- Có thể trigger tiếp WI-02 nếu bug được gắn với 1 PR fix

**Node map:** trigger → `httpRequest`(lấy commit liên quan) → `sendMessageToAiAgent` → output vào work item

### WI-05 — Acceptance Criteria Validator ✅

**Trigger:** `on_status_change → "In Review"` hoặc `on_pr_merged`

- AI đối chiếu nội dung PR + mô tả thay đổi với từng dòng acceptance criteria trong work item
- Trả về checklist: mỗi tiêu chí PASS/FAIL/không xác định + lý do
- Nếu có tiêu chí FAIL → tự động comment cảnh báo, có thể chặn chuyển sang "Done" bằng cách **không** gọi `workItem` Move Status (chỉ Move khi PASS hết) thay vì phải sửa state machine

**Node map:** trigger → `sendMessageToAiAgent` → `if` (đủ điều kiện?) → `workItem` (Update comment/field) hoặc `raiseAlert` nếu FAIL

### WI-06 — Reviewer/Assignee Suggestion ✅

**Trigger:** `on_create` hoặc `on_pr_opened`

- AI gợi ý người review/assign phù hợp dựa trên: lịch sử ai từng sửa file/module tương tự (git history), workload hiện tại (WF-07 Team Workload), chuyên môn (label/tag)
- Output: danh sách 1-3 người gợi ý kèm lý do ngắn, PM/lead chọn thủ công (không tự gán)

**Node map:** trigger → `git`(List Commits, ai từng sửa file) + `httpRequest`(workload data, chưa có node "Team Workload" riêng) → `merge` → `sendMessageToAiAgent` → comment gợi ý

### WI-07 — Stale/Blocked Task Detector 🟠

**Trigger:** cần loại trigger mới — **scheduled/polling per work item** (vd "không hoạt động quá N ngày"), khác các trigger sự kiện tức thời ở trên.

- Kiểm tra: task đứng yên (không comment/không commit/không đổi trạng thái) quá X ngày, hoặc đang bị block bởi 1 task khác chưa xong
- AI tóm tắt lý do khả dĩ (từ comment cuối, log liên quan) + gợi ý hành động tiếp theo (WF-17 Action Recommends ở cấp work item)

**Cần bổ sung:** node `wait`/schedule hiện có trong registry nhưng dùng cho delay trong 1 lần chạy, chưa có cơ chế "cron theo từng work item" — cần 1 scheduler ở tầng backend (giống `/api/workflows/:id/run` định kỳ) quét work item rồi bắn trigger, không phải thuần canvas node.

### WI-08 — Auto Status Sync theo Git Activity ✅

**Trigger:** `on_pr_opened` / `on_pr_merged` / `on_commit_pushed` (mở rộng từ `on_pr_*`)

- Khi PR mở → tự chuyển work item sang "In Review" (nếu đang "In Progress")
- Khi PR merge → tự chuyển sang "Done" hoặc "Ready for QA" tuỳ convention team
- Không cần AI, thuần rule-based — dùng `if`/`switch` map theo trạng thái PR

**Node map:** trigger → `switch` (theo PR state) → `workItem` (Move Status)

### WI-09 — Release Notes / Changelog Entry ✅

**Trigger:** `on_status_change → "Done"`

- AI tóm tắt work item (title + description + comment quan trọng) thành 1 dòng changelog theo văn phong sản phẩm, phân loại Feature/Fix/Chore theo `type`
- Gom theo release/sprint để dùng cho WF-06 hoặc release note riêng

**Node map:** trigger → `sendMessageToAiAgent` → output field "changelog_entry"

---

## 2 · Workflow nền tảng: Sync, Webhook & Phân tích Cycle/Module

Khác với WI-01..09 (input = 1 work item, chạy theo yêu cầu/sự kiện của chính nó), nhóm workflow dưới đây chạy ở **phạm vi project/hệ thống** — chúng là nguồn cấp dữ liệu và trigger cho toàn bộ nhóm WI-\* ở trên, gần với `pm-workflow-roadmap.md` hơn nhưng được thiết kế ở đây vì gọi trực tiếp lẫn nhau và cùng dùng chung node registry hiện có. Được gộp thành 3 cặp: **Sync** (đưa dữ liệu Jira/GitHub vào hệ thống định kỳ), **Webhook** (phản ứng theo thời gian thực với từng sự kiện), **Analyze** (AI đánh giá sức khoẻ Cycle/Module, dùng chung bởi cả 2 cặp trên).

### Sync Jira 🟠

**Trigger:** `manual` hoặc lên lịch định kỳ (không có node schedule/cron thật — xem gap WI-07, dùng tạm `manual`/gọi qua API backend theo giờ)

- Lấy toàn bộ issue đã đổi kể từ lần sync trước bằng JQL (`updated >= "{lastSyncAt}"`)
- Với mỗi issue: ghi vào ticket store (đối chiếu lịch sử) **và** tạo/cập nhật work item tương ứng trong hệ thống

**Node map:** trigger → `jira` (JQL Query: `updated >= -{N}m ORDER BY updated ASC`) → `ticketUpsert` (provider `jira`, lưu snapshot) → `code` (map field Jira → tham số `workItem`) → `workItem` (Update, hoặc Create nếu chưa tồn tại — cần `if`/`switch` rẽ nhánh theo có tìm thấy work item khớp `externalKey` hay không) → `ticketUpsert` (ghi `lastSyncAt` mới, hoặc dùng 1 record riêng cho sync-state)

**Cần bổ sung (🟠):** chưa có cơ chế map "issue Jira này ứng với work item nào trong hệ thống" (cần 1 field liên kết external key trên work item, hiện `PlatformWorkItem` chưa có field kiểu `externalKey`/`externalProvider`) — xem thêm mục 3.

### Sync GitHub 🟠

**Trigger:** như Sync Jira

- Với mỗi repo cấu hình: lấy branches/commits/PRs/issues mới
- Cache lại để dashboard/GitHub screen dùng, đồng thời cập nhật `linkedPRs`/`commits` trên work item nếu tìm được liên kết (vd PR title/branch chứa mã work item)

**Node map:** trigger → `git` (List Pull Requests) + `git` (List Commits) + `git` (List Issues) → `merge` → `gitCacheUpsert` (cache riêng cho dashboard) → `code` (tách mã work item từ tên nhánh/PR title, vd `feature/PMS-103-...`) → `workItem` (Update, gắn PR/commit vào work item khớp)

**Cần bổ sung (🟠):** giống Sync Jira, việc "PR/branch này thuộc work item nào" hiện làm bằng quy ước đặt tên (branch/PR chứa key), chưa có bảng liên kết tường minh trong `workflow-db`.

### Webhook Jira 🟠

**Trigger:** `webhook` (Jira gửi sự kiện `jira:issue_created` / `jira:issue_updated` / `jira:issue_deleted`, sprint start/close, v.v.)

- Rẽ nhánh theo loại sự kiện (`switch` trên `webhookEvent`)
- Cập nhật work item (nếu là sự kiện trên issue) hoặc cycle/module (nếu là sự kiện trên sprint/epic) tương ứng
- Gọi tiếp workflow **Analyze Jira Webhook Action** để AI đánh giá bản thân sự kiện đó (có bất thường không, có cần cảnh báo không)

**Node map:** `webhook` → `switch` (theo loại event) → nhánh issue: `workItem` (Update/Create) — nhánh sprint/epic: `planningGroup` (Update/Create, `kind` = cycle/module) → `httpRequest` (gọi webhook endpoint của workflow "Analyze Jira Webhook Action", đính kèm payload gốc — xem gap "gọi workflow con" ở mục 3)

**Cần bổ sung (🟠, chặn cả Webhook Jira lẫn Webhook GitHub):** node `webhook` hiện tại (`packages/workflow-core/src/nodeTypes/webhook.ts`) tự mô tả là _"simulated in this environment"_ và chỉ output `{ path, method, receivedAt }` — **không** có payload thật của request. Để workflow này chạy được cần: (1) webhook node/hạ tầng backend nhận và forward đúng body/headers thật của request Jira/GitHub gửi tới, (2) một node "Execute Workflow" (hoặc endpoint `httpRequest` gọi thẳng webhook của workflow khác) để nối 2 workflow lại — hiện chưa có node nào gọi workflow khác trực tiếp.

### Webhook GitHub 🟠

**Trigger:** `webhook` (GitHub events: `push`, `pull_request` opened/closed/merged, `issues`, `issue_comment`, …)

- Rẽ nhánh theo `X-GitHub-Event` + `action` trong payload
- Cập nhật work item liên quan (theo quy ước mã trong branch/PR title/commit message, giống Sync GitHub)
- Gọi tiếp workflow **Analyze GitHub Webhook Action**

**Node map:** `webhook` → `code` (parse `X-GitHub-Event`/`action`, tách work item key) → `switch` → `workItem` (Update — vd PR merged → Move Status) → `httpRequest` (gọi webhook endpoint của "Analyze GitHub Webhook Action")

**Cần bổ sung (🟠):** cùng 2 gap của Webhook Jira ở trên (webhook payload thật + node gọi workflow khác).

### Analyze Jira Webhook Action ✅

**Được gọi bởi:** node cuối trong workflow Webhook Jira (nhận nguyên payload sự kiện Jira + work item/cycle/module vừa được cập nhật)

- `sendMessageToAiAgent` phân tích: loại sự kiện có bất thường không (vd issue bị reopen nhiều lần, priority bị hạ đột ngột từ Urgent, sprint bị đổi ngày kết thúc sát giờ chót…), so với ngữ cảnh work item hiện tại
- Nếu AI kết luận cần cảnh báo → xuất alert

**Node map:** `webhook` (nhận payload forward từ Webhook Jira) → `sendMessageToAiAgent` (input: payload + work item liên quan, output kỳ vọng `{ needsAlert: boolean, severity, summary }`) → `if` (`needsAlert`?) → `raiseAlert` (`alertType` = "jira-webhook-action", `severityField` lấy từ output AI)

### Analyze GitHub Webhook Action ✅

**Được gọi bởi:** node cuối trong workflow Webhook GitHub

- `sendMessageToAiAgent` phân tích action (vd force-push vào `main`, PR merge không qua review, PR đóng không merge sau khi mở lâu…)
- Nếu cần cảnh báo → xuất alert

**Node map:** `webhook` (nhận payload forward từ Webhook GitHub) → `sendMessageToAiAgent` → `if` (`needsAlert`?) → `raiseAlert` (`alertType` = "github-webhook-action")

### Analyze Cycle ✅

**Trigger:** `manual` hoặc lên lịch cuối ngày/theo mốc cycle (xem gap scheduler ở WI-07)

**Thông số đầu vào (input) cần cho AI phân tích:**

| Nhóm                    | Thông số                                                                                                                                   | Nguồn                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Metadata cycle          | tên, `startDate`, `endDate`, mục tiêu/mô tả cycle                                                                                          | `planningGroup` (Get)                                                           |
| Work items trong cycle  | tổng số, đếm theo `status` (Todo/In Progress/In Review/Done/Cancelled), đếm theo `priority`, số quá hạn (`dueDate` < hôm nay và chưa Done) | `workItem` (List, filter theo `cycleId`) → `aggregate` (group theo `status`)    |
| Story points / estimate | tổng estimate vs. đã hoàn thành (nếu work item có field story point — hiện `PlatformWorkItem` chưa có field này, xem mục 3)                | `workItem` List + `aggregate`                                                   |
| Hoạt động Git trong kỳ  | số PR mở/merge, số commit trong khoảng `startDate`–`endDate`                                                                               | `git` (List Pull Requests / List Commits) hoặc `gitCacheUpsert` đã cache        |
| Lịch sử để so sánh      | health/velocity của (tối đa) 3 cycle gần nhất cùng project                                                                                 | `ticketQuery` (đọc lại kết quả Analyze Cycle các kỳ trước, xem output bên dưới) |
| Rủi ro/blocker hiện tại | danh sách work item đang "In Progress" quá lâu không đổi trạng thái, comment gần nhất                                                      | `workItem` List + `code` (tính số ngày đứng yên)                                |

**Kết quả đầu ra (output), lưu lại thành 1 record mỗi lần chạy:**

```json
{
  "cycleId": "...",
  "analyzedAt": "2026-09-10T...",
  "status": "on_track | at_risk | off_track",
  "healthScore": 0,
  "summary": "1-2 câu tóm tắt tình trạng cycle",
  "risks": [{ "title": "...", "detail": "...", "relatedWorkItemIds": ["..."] }],
  "predictedCompletionDate": "...",
  "recommendedActions": ["..."],
  "needsAlert": true,
  "alertSeverity": "low | medium | high | critical"
}
```

**Node map:** trigger → `planningGroup` (Get cycle) + `workItem` (List theo `cycleId`) + `git`/`gitCacheUpsert` (hoạt động Git) + `ticketQuery` (lịch sử) → `aggregate` (đếm theo status) → `sendMessageToAiAgent` (tổng hợp toàn bộ input trên, trả về đúng schema output) → `ticketUpsert` (lưu kết quả — 🟠 xem mục 3, `ticketUpsert` hiện chỉ hỗ trợ chuẩn hoá ticket kiểu Jira issue, chưa nhận schema tuỳ ý như trên) → `if` (`needsAlert`?) → `raiseAlert`

### Analyze Module ✅

**Trigger:** `manual` hoặc lên lịch định kỳ, tương tự Analyze Cycle

**Thông số đầu vào:** giống cấu trúc Analyze Cycle nhưng theo `moduleId` thay vì `cycleId`, cộng thêm 2 nhóm đặc thù module (module không có ranh giới thời gian cứng như cycle nên cần thêm dữ liệu về chất lượng & phụ thuộc):

| Nhóm                    | Thông số                                                                                           | Nguồn                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Metadata module         | tên, mô tả, `startDate`/`endDate` (nếu có mốc release)                                             | `planningGroup` (Get, `kind` = module)                                        |
| Work items thuộc module | tổng số, theo `status`, phân bố theo cycle nào (module có thể trải nhiều cycle)                    | `workItem` (List, filter theo `moduleId` nằm trong `moduleIds`) → `aggregate` |
| Chất lượng              | số bug phát sinh liên quan module (label/tag), kết quả `sonarQube`/`metisSoftware` gần nhất nếu có | `workItem` List (filter label bug) + `sonarQube`/`metisSoftware`              |
| Phụ thuộc               | module này có work item đang bị block bởi module khác không (dựa vào comment/label "blocked-by")   | `workItem` List + `code` (phân tích label/description)                        |
| Lịch sử                 | velocity của module tương tự trước đây (bao lâu để hoàn thành theo cùng quy mô)                    | `ticketQuery` (đọc kết quả Analyze Module các lần trước)                      |

**Kết quả đầu ra:** cùng cấu trúc JSON như Analyze Cycle (`status`/`healthScore`/`summary`/`risks`/`recommendedActions`/`needsAlert`/`alertSeverity`), thay `cycleId`/`predictedCompletionDate` bằng `moduleId`/`estimatedCompletionDate` (ước lượng theo velocity trend, không có deadline cứng như cycle).

**Node map:** trigger → `planningGroup` (Get module) + `workItem` (List theo `moduleIds`) + `sonarQube`/`metisSoftware` + `ticketQuery` (lịch sử) → `aggregate` → `sendMessageToAiAgent` → `ticketUpsert` (🟠 cùng gap schema như Analyze Cycle) → `if` (`needsAlert`?) → `raiseAlert`

---

## 3 · Node/khả năng cần bổ sung để chạy đủ các workflow trên

| Cần bổ sung                                                                   | Dùng cho                                            | Ghi chú                                                                                                                                               |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workItemTrigger` (node trigger mới, group `core`)                            | WI-01..09                                           | input = work item hiện tại, thay Manual Trigger/Webhook — có thể hoãn nếu dùng Webhook Jira/GitHub ở mục 2 làm nguồn trigger thay thế                 |
| Webhook nhận payload thật (không còn "simulated")                             | Webhook Jira, Webhook GitHub                        | `webhook` node hiện chỉ trả `{path, method, receivedAt}`, không có body request thật — chặn cứng cả 2 workflow Webhook                                |
| Node/khả năng "gọi workflow khác" (Execute Sub-Workflow)                      | Webhook Jira/GitHub → Analyze Jira/GitHub Webhook   | hiện chưa có, tạm dùng `httpRequest` gọi webhook endpoint của workflow đích (phụ thuộc gap phía trên)                                                 |
| Field liên kết external key trên work item (`externalProvider`/`externalKey`) | Sync Jira, Sync GitHub                              | `PlatformWorkItem` hiện không có field map ngược về issue Jira/PR GitHub gốc, đang phải suy luận qua quy ước đặt tên branch/PR                        |
| Field story point/estimate trên work item                                     | Analyze Cycle                                       | `PlatformWorkItem` hiện không có field số liệu ước lượng, cần để tính burndown/velocity đúng nghĩa                                                    |
| `ticketUpsert` nhận schema tuỳ ý (không chỉ chuẩn hoá theo Jira issue)        | Analyze Cycle, Analyze Module                       | hiện `ticketUpsert` cứng normalize theo `NormalizedTicket` (title/status/priority/assignee) — không khớp schema kết quả phân tích Cycle/Module ở trên |
| Node "lấy diff/patch nội dung PR"                                             | WI-02, WI-03                                        | `git` node đã có List Pull Requests/Commits nhưng chưa có action lấy nội dung diff                                                                    |
| Scheduler cấp work item/cấp project (polling định kỳ)                         | WI-07, Sync Jira, Sync GitHub, Analyze Cycle/Module | khác cơ chế trigger sự kiện, cần tầng backend riêng (cron)                                                                                            |
| Credentials thật cho Git/Jira/Metis/SonarQube                                 | toàn bộ workflow gọi app node                       | đã ghi nhận là nợ kỹ thuật chung, xem gap tracker                                                                                                     |

---

## 4 · Thứ tự đề xuất triển khai

1. **WI-08** (Auto Status Sync) — đơn giản nhất, không cần AI, validate cơ chế trigger `on_pr_*` trước
2. **WI-01** (Auto Triage) — showcase AI sớm, ít phụ thuộc dữ liệu ngoài
3. **Webhook nhận payload thật** — mở khoá cho toàn bộ nhóm Webhook Jira/GitHub + 2 workflow Analyze Webhook Action, giá trị cao vì biến các WI-\* từ "cần bấm manual" thành thời gian thực
4. **WI-02** (PR Review Assistant) — giá trị cao nhất, nhưng cần node PR diff/credentials
5. **Analyze Cycle** rồi **Analyze Module** — sau khi có field story point + `ticketUpsert` schema tuỳ ý, tái dùng lại phần lớn phần "input thu thập" đã dùng cho WI-03/WI-04
6. Các workflow còn lại theo nhu cầu thực tế của team

---

_Tài liệu song song với [pm-workflow-roadmap.md](./pm-workflow-roadmap.md); roadmap kia là workflow hệ thống, tài liệu này là workflow theo từng work item._
