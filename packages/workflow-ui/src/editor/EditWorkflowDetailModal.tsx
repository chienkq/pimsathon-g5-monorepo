import { useState } from "react";

export interface EditWorkflowDetailModalProps {
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

export function EditWorkflowDetailModal({ name, description, onSave, onClose }: EditWorkflowDetailModalProps) {
  const [nameDraft, setNameDraft] = useState(name);
  const [descriptionDraft, setDescriptionDraft] = useState(description);

  return (
    <div className="wf-detail-modal-backdrop" onClick={onClose}>
      <div className="wf-detail-modal" onClick={(event) => event.stopPropagation()}>
        <header className="wf-detail-modal__header">
          <h2>Edit Detail</h2>
          <button type="button" className="wf-link" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="wf-detail-modal__body">
          <label className="wf-detail-modal__field">
            <span>Name</span>
            <input
              className="wf-input"
              value={nameDraft}
              autoFocus
              onChange={(event) => setNameDraft(event.target.value)}
            />
          </label>
          <label className="wf-detail-modal__field">
            <span>Description</span>
            <textarea
              className="wf-input"
              rows={5}
              value={descriptionDraft}
              placeholder="What does this workflow do?"
              onChange={(event) => setDescriptionDraft(event.target.value)}
            />
          </label>
        </div>
        <footer className="wf-detail-modal__footer">
          <button type="button" className="wf-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="wf-button wf-button--primary"
            onClick={() => onSave(nameDraft, descriptionDraft)}
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
}
