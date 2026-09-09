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

---

## 1 · Các workflow đề xuất theo Work Item

### WI-01 — Auto Triage khi tạo task ✅

**Trigger:** `on_create`

- AI (`sendMessageToAiAgent`) đọc title + description, gợi ý: loại việc (bug/feature/chore), priority, estimate (story point/giờ), label phù hợp
- So khớp với các task cũ tương tự (dùng Knowledge Base đã index ở WF-04) để tránh trùng lặp — nếu tìm thấy task giống, comment link vào task cũ
- Ghi kết quả gợi ý dưới dạng comment hoặc field draft (PM/assignee duyệt lại, không tự động ghi đè)

**Node map:** `webItemTrigger`(🟠) → `sendMessageToAiAgent` → `if` (có task trùng?) → `humanReview`/comment output

### WI-02 — PR Review Assistant ✅

**Trigger:** `on_pr_opened` (hoặc `on_pr_linked`)

- Lấy diff của PR liên kết (qua dữ liệu Git đã đồng bộ ở WF-02)
- AI phân tích: code style, rủi ro (thiếu test, thay đổi lớn ở file nhạy cảm), đối chiếu với **acceptance criteria** trong work item xem PR có khớp mô tả yêu cầu không
- Gọi Metis/SonarQube (`metisSoftware`, `sonarQube`) lấy kết quả phân tích tĩnh nếu có
- Tổng hợp thành 1 comment review trên PR hoặc trên work item, gắn cờ cảnh báo nếu lệch acceptance criteria

**Node map:** trigger → `httpRequest`/Git app node (lấy diff) → `sendMessageToAiAgent` → `metisSoftware`/`sonarQube` (song song, `merge`) → output comment

**Cần bổ sung (🟠):** chưa có node "lấy diff PR" chuyên biệt — tạm dùng `httpRequest` gọi thẳng GitHub/GitLab API; sau này có thể tách thành node App riêng (`githubPullRequest`) giống nhóm Human Review được factory hoá.

### WI-03 — Code Change Impact Analysis ✅

**Trigger:** `on_pr_linked` / `manual`

- Thu thập: commit/PR liên quan tới work item + các work item khác từng chạm cùng file/module (qua git blame + mapping WF-02)
- AI đánh giá mức độ rủi ro thay đổi (số file, module lõi hay không, có test đi kèm không), liệt kê các work item/team có thể bị ảnh hưởng
- Output: risk score + danh sách cảnh báo, hiển thị ngay trên work item

**Node map:** trigger → `httpRequest` (git blame/file history) → `sendMessageToAiAgent` → ghi kết quả vào field/comment

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
- Nếu có tiêu chí FAIL → tự động comment cảnh báo, có thể chặn chuyển sang "Done" (dùng `if` node để rẽ nhánh, chưa tự động block trạng thái vì cần tích hợp sâu hơn với state machine work item — 🟠)

**Node map:** trigger → `sendMessageToAiAgent` → `if` (đủ điều kiện?) → comment / cảnh báo

### WI-06 — Reviewer/Assignee Suggestion ✅

**Trigger:** `on_create` hoặc `on_pr_opened`

- AI gợi ý người review/assign phù hợp dựa trên: lịch sử ai từng sửa file/module tương tự (git history), workload hiện tại (WF-07 Team Workload), chuyên môn (label/tag)
- Output: danh sách 1-3 người gợi ý kèm lý do ngắn, PM/lead chọn thủ công (không tự gán)

**Node map:** trigger → `httpRequest`(git history) + `httpRequest`(workload data) → `merge` → `sendMessageToAiAgent` → comment gợi ý

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

**Node map:** trigger → `switch` (theo PR state) → cập nhật field trạng thái work item (cần node "update work item" — 🟠, hiện chưa có node ghi ngược vào chính work item, chỉ có comment/field draft)

### WI-09 — Release Notes / Changelog Entry ✅

**Trigger:** `on_status_change → "Done"`

- AI tóm tắt work item (title + description + comment quan trọng) thành 1 dòng changelog theo văn phong sản phẩm, phân loại Feature/Fix/Chore theo `type`
- Gom theo release/sprint để dùng cho WF-06 hoặc release note riêng

**Node map:** trigger → `sendMessageToAiAgent` → output field "changelog_entry"

---

## 2 · Node/khả năng cần bổ sung để chạy đủ các workflow trên

| Cần bổ sung                                                      | Dùng cho            | Ghi chú                                                                       |
| ---------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `workItemTrigger` (node trigger mới, group `core`)               | tất cả              | input = work item hiện tại, thay Manual Trigger/Webhook                       |
| Node "update work item" (ghi field/trạng thái ngược lại)         | WI-05, WI-08        | hiện engine chỉ có output đọc, chưa có node ghi ngược vào work item gốc       |
| Node App riêng cho PR (`githubPullRequest`/`gitlabMergeRequest`) | WI-02, WI-03        | tạm dùng `httpRequest` thay thế, có thể tách factory giống Human Review nodes |
| Scheduler cấp work item (polling định kỳ)                        | WI-07               | khác cơ chế trigger sự kiện, cần tầng backend riêng                           |
| Credentials thật cho Git/Metis/SonarQube                         | WI-02, WI-03, WI-06 | đã ghi nhận là nợ kỹ thuật chung, xem gap tracker                             |

---

## 3 · Thứ tự đề xuất triển khai

1. **WI-08** (Auto Status Sync) — đơn giản nhất, không cần AI, validate cơ chế trigger `on_pr_*` trước
2. **WI-01** (Auto Triage) — showcase AI sớm, ít phụ thuộc dữ liệu ngoài
3. **WI-02** (PR Review Assistant) — giá trị cao nhất, nhưng cần node PR/credentials
4. Các workflow còn lại theo nhu cầu thực tế của team

---

_Tài liệu song song với [pm-workflow-roadmap.md](./pm-workflow-roadmap.md); roadmap kia là workflow hệ thống, tài liệu này là workflow theo từng work item._
