import { TaskLinkedList, Task } from "./linkedList.js";

// TODO: al desplegar en Vercel, apuntar esto al backend real (Render/Fly/VM).
// Vercel no ejecuta un servidor Python persistente como el de este taller.
const API_BASE_URL = "http://localhost:8000";

const tasks = new TaskLinkedList();

const listEl = document.getElementById("task-list") as HTMLUListElement;
const formEl = document.getElementById("task-form") as HTMLFormElement;
const inputEl = document.getElementById("task-input") as HTMLInputElement;
const errorEl = document.getElementById("error") as HTMLParagraphElement;
const emptyEl = document.getElementById("empty-state") as HTMLParagraphElement;

function showError(message: string): void {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError(): void {
  errorEl.hidden = true;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function render(): void {
  listEl.innerHTML = "";
  let count = 0;

  // Recorrido explícito por punteros, sin convertir la lista a Array.
  for (const node of tasks) {
    count += 1;

    const li = document.createElement("li");
    li.className = "task" + (node.completed ? " task--done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = node.completed;
    checkbox.addEventListener("change", () => toggleTask(node.id));

    const label = document.createElement("span");
    label.textContent = node.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Eliminar";
    deleteBtn.addEventListener("click", () => deleteTask(node.id));

    li.append(checkbox, label, deleteBtn);
    listEl.appendChild(li);
  }

  emptyEl.hidden = count > 0;
}

async function loadTasks(): Promise<void> {
  try {
    const data = await api<Task[]>("/api/tasks");
    tasks.clear();
    for (const task of data) tasks.append(task);
    clearError();
    render();
  } catch (err) {
    showError((err as Error).message);
  }
}

async function addTask(title: string): Promise<void> {
  try {
    const created = await api<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    tasks.append(created);
    clearError();
    render();
  } catch (err) {
    showError((err as Error).message);
  }
}

async function toggleTask(id: number): Promise<void> {
  try {
    const updated = await api<Task>(`/api/tasks/${id}`, { method: "PATCH" });
    const node = tasks.find(id);
    if (node) node.completed = updated.completed;
    clearError();
    render();
  } catch (err) {
    showError((err as Error).message);
  }
}

async function deleteTask(id: number): Promise<void> {
  try {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    tasks.remove(id);
    clearError();
    render();
  } catch (err) {
    showError((err as Error).message);
  }
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = inputEl.value.trim();
  if (!title) return;
  addTask(title);
  inputEl.value = "";
});

loadTasks();
