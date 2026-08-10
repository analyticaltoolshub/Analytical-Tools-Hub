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

  return { formatDate, addDays, daysBetween, getWeek, getWeekStart, getWeekEnd };
}));
