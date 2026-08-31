import type { Lane } from '../domain/process-step.js';
import { LANES } from '../domain/process-step.js';

export interface StepEditData {
  id: string;
  action: string;
  description: string;
  lane: Lane;
  dependsOn: string[];
}

export type StepEditCallback = (data: StepEditData) => void;

/**
 * Creates and manages the modal editor for process steps.
 */
export class StepEditor {
  private overlay: HTMLDivElement;
  private modal: HTMLDivElement;
  private form: HTMLFormElement;
  private titleEl: HTMLHeadingElement;
  private stepIdInput: HTMLInputElement;
  private actionInput: HTMLInputElement;
  private descriptionInput: HTMLTextAreaElement;
  private laneSelect: HTMLSelectElement;
  private dependsOnCheckboxes: HTMLDivElement;
  private allSteps: { id: string; action: string; lane: string }[];
  private onSubmit: StepEditCallback | null = null;

  constructor() {
    this.allSteps = [];

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'editor-overlay editor-overlay--hidden';
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Create modal
    this.modal = document.createElement('div');
    this.modal.className = 'editor-modal';

    // Title
    this.titleEl = document.createElement('h3');
    this.titleEl.className = 'editor-modal__title';
    this.titleEl.textContent = 'Edit Step';

    // Form
    this.form = document.createElement('form');
    this.form.className = 'editor-form';
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Hidden step ID
    this.stepIdInput = document.createElement('input');
    this.stepIdInput.type = 'hidden';

    // Action field
    const actionGroup = this.createFormGroup('Action', 'action');
    this.actionInput = actionGroup.querySelector('input') as HTMLInputElement;
    this.form.appendChild(actionGroup);

    // Description field
    const descGroup = this.createFormGroup('Description', 'description', true);
    this.descriptionInput = descGroup.querySelector('textarea') as HTMLTextAreaElement;
    this.form.appendChild(descGroup);

    // Lane select
    const laneGroup = document.createElement('div');
    laneGroup.className = 'editor-form__group';
    const laneLabel = document.createElement('label');
    laneLabel.className = 'editor-form__label';
    laneLabel.textContent = 'Lane';
    laneLabel.setAttribute('for', 'editor-lane');
    this.laneSelect = document.createElement('select');
    this.laneSelect.className = 'editor-form__select';
    this.laneSelect.id = 'editor-lane';
    for (const lane of LANES) {
      const opt = document.createElement('option');
      opt.value = lane;
      opt.textContent = lane;
      this.laneSelect.appendChild(opt);
    }
    laneGroup.appendChild(laneLabel);
    laneGroup.appendChild(this.laneSelect);
    this.form.appendChild(laneGroup);

    // Dependencies checkboxes
    const depsGroup = document.createElement('div');
    depsGroup.className = 'editor-form__group';
    const depsLabel = document.createElement('label');
    depsLabel.className = 'editor-form__label';
    depsLabel.textContent = 'Depends on';
    this.dependsOnCheckboxes = document.createElement('div');
    this.dependsOnCheckboxes.className = 'editor-form__checkboxes';
    depsGroup.appendChild(depsLabel);
    depsGroup.appendChild(this.dependsOnCheckboxes);
    this.form.appendChild(depsGroup);

    // Buttons
    const buttons = document.createElement('div');
    buttons.className = 'editor-form__buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn--secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn--primary';
    saveBtn.textContent = 'Save';

    buttons.appendChild(cancelBtn);
    buttons.appendChild(saveBtn);
    this.form.appendChild(buttons);

    // Assemble modal
    this.modal.appendChild(this.titleEl);
    this.modal.appendChild(this.form);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay.classList.contains('editor-overlay--hidden')) {
        this.close();
      }
    });
  }

  setAllSteps(steps: { id: string; action: string; lane: string }[]): void {
    this.allSteps = steps;
  }

  onSubmit_(callback: StepEditCallback): void {
    this.onSubmit = callback;
  }

  open(stepData: StepEditData): void {
    this.titleEl.textContent = `Edit: ${stepData.action}`;
    this.stepIdInput.value = stepData.id;
    this.actionInput.value = stepData.action;
    this.descriptionInput.value = stepData.description;
    this.laneSelect.value = stepData.lane;

    // Build dependency checkboxes (exclude self)
    this.dependsOnCheckboxes.innerHTML = '';
    for (const step of this.allSteps) {
      if (step.id === stepData.id) continue;

      const checkboxWrapper = document.createElement('label');
      checkboxWrapper.className = 'editor-form__checkbox-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = step.id;
      checkbox.checked = stepData.dependsOn.includes(step.id);

      const span = document.createElement('span');
      span.textContent = `${step.action} (${step.lane})`;

      checkboxWrapper.appendChild(checkbox);
      checkboxWrapper.appendChild(span);
      this.dependsOnCheckboxes.appendChild(checkboxWrapper);
    }

    this.overlay.classList.remove('editor-overlay--hidden');
    this.actionInput.focus();
  }

  close(): void {
    this.overlay.classList.add('editor-overlay--hidden');
  }

  private handleSubmit(): void {
    const action = this.actionInput.value.trim();
    const description = this.descriptionInput.value.trim();
    const lane = this.laneSelect.value as Lane;

    if (!action || !description) return;

    const checkedBoxes = this.dependsOnCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
    const dependsOn = Array.from(checkedBoxes).map((cb) => (cb as HTMLInputElement).value);

    const data: StepEditData = {
      id: this.stepIdInput.value,
      action,
      description,
      lane,
      dependsOn,
    };

    if (this.onSubmit) {
      this.onSubmit(data);
    }

    this.close();
  }

  private createFormGroup(label: string, name: string, isTextarea = false): HTMLDivElement {
    const group = document.createElement('div');
    group.className = 'editor-form__group';

    const labelEl = document.createElement('label');
    labelEl.className = 'editor-form__label';
    labelEl.textContent = label;
    labelEl.setAttribute('for', `editor-${name}`);

    let input: HTMLElement;
    if (isTextarea) {
      input = document.createElement('textarea');
      (input as HTMLTextAreaElement).rows = 3;
    } else {
      input = document.createElement('input');
      (input as HTMLInputElement).type = 'text';
    }
    input.className = isTextarea ? 'editor-form__textarea' : 'editor-form__input';
    input.id = `editor-${name}`;

    group.appendChild(labelEl);
    group.appendChild(input);
    return group;
  }
}
