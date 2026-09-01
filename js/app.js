/**
 * app.js
 * ---------------------------------------------------------------------------
 * Wires the pure functions in logic.js (window.TaskLogic) up to the DOM and
 * to localStorage. Nothing in this file is unit-tested directly — it is a
 * thin, imperative layer on top of the tested logic module, which is the
 * standard split for making a small app's core behaviour CI-testable.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cicd-demo-tasks-v1';
  const COUNTER_KEY = 'cicd-demo-next-id-v1';

  const $ = (selector) => document.querySelector(selector);

  const form = $('#task-form');
  const input = $('#task-input');
  const list = $('#task-list');
  const stats = $('#task-stats');
  const filterButtons = document.querySelectorAll('[data-filter]');
  const emptyState = $('#empty-state');
  const errorEl = $('#form-error');

  let tasks = loadTasks();
  let nextId = loadCounter();
  let currentFilter = 'all';

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // localStorage may be unavailable (e.g. private browsing) — the app
      // still works for the current session, it just won't persist.
    }
  }

  function loadCounter() {
    const raw = localStorage.getItem(COUNTER_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
  }

  function saveCounter() {
    try {
      localStorage.setItem(COUNTER_KEY, String(nextId));
    } catch (e) {
      /* no-op, see saveTasks */
    }
  }

  function render() {
    const visible = window.TaskLogic.filterTasks(tasks, currentFilter);
    list.innerHTML = '';

    visible.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.completed ? ' completed' : '');
      li.dataset.id = String(task.id);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark "${task.text}" as complete`);
      checkbox.addEventListener('change', () => {
        tasks = window.TaskLogic.toggleTask(tasks, task.id);
        saveTasks();
        render();
      });

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete "${task.text}"`);
      deleteBtn.addEventListener('click', () => {
        tasks = window.TaskLogic.deleteTask(tasks, task.id);
        saveTasks();
        render();
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    emptyState.hidden = visible.length !== 0;

    const s = window.TaskLogic.getStats(tasks);
    stats.textContent = `${s.completed} of ${s.total} done`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value;

    if (!window.TaskLogic.validateTaskText(text)) {
      errorEl.textContent = text.trim().length === 0
        ? 'Enter a task before adding it.'
        : `Tasks must be ${window.TaskLogic.MAX_TASK_LENGTH} characters or fewer.`;
      errorEl.hidden = false;
      return;
    }

    errorEl.hidden = true;
    tasks = window.TaskLogic.addTask(tasks, text, nextId);
    nextId += 1;
    saveCounter();
    saveTasks();
    input.value = '';
    render();
    input.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });

  render();
})();
