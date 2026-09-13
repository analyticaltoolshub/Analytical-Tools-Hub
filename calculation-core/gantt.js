(function initialiseGanttCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.ATHGantt = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createGanttCore() {
  const DAY_MS = 86400000;

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(dateInput, amount) {
    const date = new Date(dateInput);
    date.setDate(date.getDate() + amount);
    return date;
  }

  function dateSerial(dateInput) {
    const date = new Date(dateInput);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
  }

  function daysBetween(startDate, endDate) {
    return Math.round(dateSerial(endDate) - dateSerial(startDate));
  }

  function getWeek(dateInput) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil((daysBetween(yearStart, date) + 1) / 7);
  }

  function getWeekStart(dateInput) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return date;
  }

  function getWeekEnd(dateInput) {
    return addDays(getWeekStart(dateInput), 6);
  }

  function validateTasks(tasks) {
    if (!Array.isArray(tasks) || tasks.length > 1000) throw new Error('JSON must contain an array of at most 1,000 tasks.');
    return tasks.map((task, index) => {
      const label = `Task ${index + 1}`;
      if (!task || typeof task.task !== 'string' || !task.task.trim()) throw new Error(`${label} needs a name.`);
      for (const field of ['start', 'end']) {
        const value = task[field];
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`${label}: invalid ${field} date.`);
      }
      if (task.end < task.start) throw new Error(`${label}: end date precedes start date.`);
      if (typeof task.progress !== 'number' || !Number.isFinite(task.progress) || task.progress < 0 || task.progress > 100) throw new Error(`${label}: progress must be between 0 and 100.`);
      if (typeof task.milestone !== 'boolean') throw new Error(`${label}: milestone must be true or false.`);
      return { task: task.task, start: task.start, end: task.end, progress: task.progress, milestone: task.milestone };
    });
  }

  return { formatDate, addDays, daysBetween, getWeek, getWeekStart, getWeekEnd, validateTasks };
}));
