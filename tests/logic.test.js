const {
  MAX_TASK_LENGTH,
  validateTaskText,
  createTask,
  addTask,
  toggleTask,
  deleteTask,
  editTaskText,
  filterTasks,
  getStats
} = require('../js/logic');

describe('validateTaskText', () => {
  test('accepts normal text', () => {
    expect(validateTaskText('Write final report')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(validateTaskText('')).toBe(false);
  });

  test('rejects whitespace-only text', () => {
    expect(validateTaskText('    ')).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(validateTaskText(null)).toBe(false);
    expect(validateTaskText(undefined)).toBe(false);
    expect(validateTaskText(42)).toBe(false);
  });

  test('accepts text exactly at the max length', () => {
    expect(validateTaskText('a'.repeat(MAX_TASK_LENGTH))).toBe(true);
  });

  test('rejects text over the max length', () => {
    expect(validateTaskText('a'.repeat(MAX_TASK_LENGTH + 1))).toBe(false);
  });
});

describe('createTask', () => {
  test('creates a task with trimmed text and completed = false', () => {
    const task = createTask('  Buy milk  ', 1);
    expect(task).toEqual({ id: 1, text: 'Buy milk', completed: false, createdAt: 1 });
  });
});

describe('addTask', () => {
  test('appends a valid task without mutating the original array', () => {
    const original = [];
    const result = addTask(original, 'Deploy pipeline', 1);
    expect(original).toEqual([]); // untouched
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 1, text: 'Deploy pipeline' });
  });

  test('returns the same array reference when text is invalid', () => {
    const original = [{ id: 1, text: 'Existing', completed: false, createdAt: 1 }];
    const result = addTask(original, '   ', 2);
    expect(result).toBe(original);
    expect(result).toHaveLength(1);
  });

  test('throws a TypeError when tasks is not an array', () => {
    expect(() => addTask(null, 'x', 1)).toThrow(TypeError);
  });
});

describe('toggleTask', () => {
  const tasks = [
    { id: 1, text: 'A', completed: false, createdAt: 1 },
    { id: 2, text: 'B', completed: true, createdAt: 2 }
  ];

  test('flips completed for the matching id', () => {
    const result = toggleTask(tasks, 1);
    expect(result.find((t) => t.id === 1).completed).toBe(true);
    expect(result.find((t) => t.id === 2).completed).toBe(true); // unchanged
  });

  test('is a no-op for an unknown id', () => {
    const result = toggleTask(tasks, 999);
    expect(result).toBe(tasks);
  });

  test('does not mutate the original array', () => {
    const before = JSON.parse(JSON.stringify(tasks));
    toggleTask(tasks, 1);
    expect(tasks).toEqual(before);
  });
});

describe('deleteTask', () => {
  const tasks = [
    { id: 1, text: 'A', completed: false, createdAt: 1 },
    { id: 2, text: 'B', completed: false, createdAt: 2 }
  ];

  test('removes the matching task', () => {
    const result = deleteTask(tasks, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  test('is a no-op for an unknown id', () => {
    const result = deleteTask(tasks, 999);
    expect(result).toBe(tasks);
  });
});

describe('editTaskText', () => {
  const tasks = [{ id: 1, text: 'Old text', completed: false, createdAt: 1 }];

  test('updates text when valid and id exists', () => {
    const result = editTaskText(tasks, 1, 'New text');
    expect(result[0].text).toBe('New text');
  });

  test('is a no-op when the new text is invalid', () => {
    const result = editTaskText(tasks, 1, '   ');
    expect(result).toBe(tasks);
  });

  test('is a no-op for an unknown id', () => {
    const result = editTaskText(tasks, 999, 'New text');
    expect(result).toBe(tasks);
  });
});

describe('filterTasks', () => {
  const tasks = [
    { id: 1, text: 'A', completed: false, createdAt: 1 },
    { id: 2, text: 'B', completed: true, createdAt: 2 },
    { id: 3, text: 'C', completed: false, createdAt: 3 }
  ];

  test('"all" (or anything unrecognised) returns every task', () => {
    expect(filterTasks(tasks, 'all')).toEqual(tasks);
    expect(filterTasks(tasks, 'nonsense')).toEqual(tasks);
  });

  test('"active" returns only incomplete tasks', () => {
    expect(filterTasks(tasks, 'active').map((t) => t.id)).toEqual([1, 3]);
  });

  test('"completed" returns only completed tasks', () => {
    expect(filterTasks(tasks, 'completed').map((t) => t.id)).toEqual([2]);
  });
});

describe('getStats', () => {
  test('computes total, completed, and active counts', () => {
    const tasks = [
      { id: 1, completed: false },
      { id: 2, completed: true },
      { id: 3, completed: true }
    ];
    expect(getStats(tasks)).toEqual({ total: 3, completed: 2, active: 1 });
  });

  test('handles an empty list', () => {
    expect(getStats([])).toEqual({ total: 0, completed: 0, active: 0 });
  });
});

describe('end-to-end sequence (integration-style)', () => {
  test('add, toggle, edit, filter, delete work together correctly', () => {
    let tasks = [];
    tasks = addTask(tasks, 'Set up repository', 1);
    tasks = addTask(tasks, 'Write CI workflow', 2);
    tasks = addTask(tasks, 'Configure GitHub Pages', 3);
    expect(tasks).toHaveLength(3);

    tasks = toggleTask(tasks, 1);
    expect(getStats(tasks)).toEqual({ total: 3, completed: 1, active: 2 });

    tasks = editTaskText(tasks, 2, 'Write the CI workflow file');
    expect(tasks.find((t) => t.id === 2).text).toBe('Write the CI workflow file');

    expect(filterTasks(tasks, 'active')).toHaveLength(2);

    tasks = deleteTask(tasks, 3);
    expect(tasks).toHaveLength(2);
    expect(getStats(tasks)).toEqual({ total: 2, completed: 1, active: 1 });
  });
});
