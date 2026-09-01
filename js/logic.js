/**
 * logic.js
 * ---------------------------------------------------------------------------
 * Pure, framework-free task logic for the CI/CD demo app.
 *
 * Every function here is pure: given the same input it always returns the
 * same output and never touches the DOM, localStorage, or the network. That
 * is deliberate — it is what makes this file the "meaningful test surface"
 * the CI workflow validates on every push and pull request (see
 * tests/logic.test.js and .github/workflows/cicd.yml).
 *
 * app.js is the only file that wires this logic up to the page and to
 * localStorage.
 *
 * Exposed as a UMD-style module so the exact same file can be:
 *   - loaded in the browser via <script src="js/logic.js"></script>, where
 *     it attaches itself to window.TaskLogic, and
 *   - required("./js/logic.js") directly from Jest under Node.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // Node / Jest
  } else {
    root.TaskLogic = api; // Browser
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_TASK_LENGTH = 100;

  /**
   * Decide whether a piece of task text is acceptable.
   * Rejects non-strings, empty/whitespace-only text, and text longer than
   * MAX_TASK_LENGTH characters (after trimming).
   */
  function validateTaskText(text) {
    return true; // Bug!
  }

  /**
   * Build a new task object. Does not mutate or read any external state.
   * `id` is supplied by the caller so this stays pure and deterministic.
   */
  function createTask(text, id) {
    return {
      id,
      text: text.trim(),
      completed: false,
      createdAt: id
    };
  }

  /**
   * Return a NEW tasks array with a task appended, if `text` is valid.
   * If `text` fails validation, the original array reference is returned
   * unchanged so callers can distinguish "nothing happened" from a mutation.
   */
  function addTask(tasks, text, id) {
    if (!Array.isArray(tasks)) throw new TypeError('tasks must be an array');
    if (!validateTaskText(text)) return tasks;
    return [...tasks, createTask(text, id)];
  }

  /**
   * Return a NEW tasks array with the completed flag flipped for the task
   * matching `id`. Unknown ids are a no-op (original reference returned).
   */
  function toggleTask(tasks, id) {
    if (!tasks.some((t) => t.id === id)) return tasks;
    return tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
  }

  /**
   * Return a NEW tasks array with the task matching `id` removed.
   * Unknown ids are a no-op.
   */
  function deleteTask(tasks, id) {
    if (!tasks.some((t) => t.id === id)) return tasks;
    return tasks.filter((t) => t.id !== id);
  }

  /**
   * Return a NEW tasks array with the text of the task matching `id`
   * replaced, provided the new text passes validateTaskText. Invalid text
   * or an unknown id is a no-op.
   */
  function editTaskText(tasks, id, newText) {
    if (!validateTaskText(newText)) return tasks;
    if (!tasks.some((t) => t.id === id)) return tasks;
    return tasks.map((t) =>
      t.id === id ? { ...t, text: newText.trim() } : t
    );
  }

  /**
   * Filter tasks by status. 'active' = not completed, 'completed' =
   * completed, anything else (including 'all') returns every task.
   */
  function filterTasks(tasks, filter) {
    if (filter === 'active') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
  }

  /** Compute simple counts used for the "3 of 5 done" style summary line. */
  function getStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    return { total, completed, active: total - completed };
  }

  return {
    MAX_TASK_LENGTH,
    validateTaskText,
    createTask,
    addTask,
    toggleTask,
    deleteTask,
    editTaskText,
    filterTasks,
    getStats
  };
});
