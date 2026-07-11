const pixelsPerDay = 24;

let tasks = [];

const taskTableBody = document.querySelector("#taskTable tbody");
const taskList = document.getElementById("taskList");
const gantt = document.getElementById("gantt");
const ganttOutput = document.getElementById("gantt-output");
const ganttWrapper = document.querySelector(".gantt-wrapper");
const timelinePanel = document.querySelector(".timeline-panel");
const fullscreenTimelineButton = document.getElementById("fullscreenTimelineButton");
const fileInput = document.getElementById("fileInput");
const errorMessage = document.getElementById("ganttError");

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

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

function getNextMonday() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  return addDays(today, daysUntilMonday);
}

function createTask(task, startOffset, endOffset, progress = 0, milestone = false) {
  const anchorDate = getNextMonday();
  const start = addDays(anchorDate, startOffset);
  const end = addDays(anchorDate, milestone ? startOffset : endOffset);

  return {
    task,
    start: formatDate(start),
    end: formatDate(end),
    progress,
    milestone,
  };
}

function getSamplePlan(sampleKey) {
  const samplePlans = {
    implementation: [
      createTask("Scope confirmation", 0, 4, 40),
      createTask("Data and requirements review", 5, 11, 15),
      createTask("Solution configuration", 12, 25, 0),
      createTask("User acceptance testing", 26, 32, 0),
      createTask("Training and handover", 33, 36, 0),
      createTask("Go-live readiness review", 37, 37, 0, true),
      createTask("Post-launch support", 38, 49, 0),
    ],
    improvement: [
      createTask("Current-state mapping", 0, 5, 60),
      createTask("Baseline data collection", 3, 10, 35),
      createTask("Root-cause analysis", 11, 16, 0),
      createTask("Improvement workshop", 17, 17, 0, true),
      createTask("Pilot process changes", 18, 31, 0),
      createTask("Measure pilot results", 32, 38, 0),
      createTask("Standardize new process", 39, 48, 0),
    ],
    launch: [
      createTask("Launch plan kickoff", 0, 0, 0, true),
      createTask("Offer and message finalization", 1, 7, 50),
      createTask("Landing page and assets", 5, 16, 25),
      createTask("Operational readiness", 12, 21, 10),
      createTask("Stakeholder approval", 22, 22, 0, true),
      createTask("Launch execution", 23, 27, 0),
      createTask("Performance review", 34, 34, 0, true),
    ],
  };

  return samplePlans[sampleKey] || [];
}

function days(startDate, endDate) {
  return Math.floor((endDate - startDate) / 86400000);
}

function getWeek(dateInput) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 4 - (date.getDay() || 7));

  const yearStart = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getWeekStart(dateInput) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date;
}

function getWeekEnd(dateInput) {
  const date = getWeekStart(dateInput);
  date.setDate(date.getDate() + 6);
  return date;
}

function getValidatedTasks() {
  return tasks
    .map((task) => ({
      task: String(task.task || "").trim() || "Untitled Task",
      start: task.start,
      end: task.end,
      progress: Math.max(0, Math.min(100, Number(task.progress) || 0)),
      milestone: Boolean(task.milestone),
    }))
    .filter((task) => {
      const start = new Date(task.start);
      const end = new Date(task.end);
      return !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && start <= end;
    });
}

function addTask() {
  const today = formatDate(new Date());
  tasks.push({
    task: "New Task",
    start: today,
    end: today,
    progress: 0,
    milestone: false,
  });

  renderTable();
  render();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTable();
  render();
}

function updateTask(index, field, value) {
  if (!tasks[index]) return;

  if (field === "progress") {
    tasks[index][field] = Math.max(0, Math.min(100, Number(value) || 0));
  } else if (field === "milestone") {
    tasks[index][field] = value === "true";
  } else {
    tasks[index][field] = value;
  }

  clearError();
  render();
}

function createInput(type, value, index, field) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.dataset.index = index;
  input.dataset.field = field;

  if (field === "progress") {
    input.min = "0";
    input.max = "100";
  }

  return input;
}

function renderTable() {
  taskTableBody.innerHTML = "";

  tasks.forEach((task, index) => {
    const row = document.createElement("tr");

    const taskCell = document.createElement("td");
    taskCell.appendChild(createInput("text", task.task, index, "task"));

    const startCell = document.createElement("td");
    startCell.appendChild(createInput("date", task.start, index, "start"));

    const endCell = document.createElement("td");
    endCell.appendChild(createInput("date", task.end, index, "end"));

    const progressCell = document.createElement("td");
    progressCell.appendChild(createInput("number", task.progress, index, "progress"));

    const milestoneCell = document.createElement("td");
    const select = document.createElement("select");
    select.dataset.index = index;
    select.dataset.field = "milestone";
    select.innerHTML = `
      <option value="false"${!task.milestone ? " selected" : ""}>No</option>
      <option value="true"${task.milestone ? " selected" : ""}>Yes</option>
    `;
    milestoneCell.appendChild(select);

    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-task";
    deleteButton.dataset.index = index;
    deleteButton.setAttribute("aria-label", `Delete ${task.task || "task"}`);
    deleteButton.textContent = "X";
    deleteCell.appendChild(deleteButton);

    row.append(taskCell, startCell, endCell, progressCell, milestoneCell, deleteCell);
    taskTableBody.appendChild(row);
  });
}

function saveJSON() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `gantt-plan-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function loadJSON() {
  fileInput.click();
}

function loadSamplePlan(sampleKey) {
  const selectedPlan = getSamplePlan(sampleKey);
  if (!selectedPlan.length) return;

  tasks = selectedPlan.map((task) => ({ ...task }));
  clearError();
  renderTable();
  render();
}

function updateGanttHeight(validTasks) {
  const headerHeight = 64;
  const rowHeight = 42;
  const scrollbarBuffer = 20;
  const borderBuffer = 2;
  const minimumHeight = 220;
  const height = Math.max(
    minimumHeight,
    headerHeight + (validTasks.length * rowHeight) + scrollbarBuffer + borderBuffer
  );

  ganttWrapper.style.setProperty("--gantt-height", `${height}px`);
}

function setTimelineFullscreen(isFullscreen) {
  document.body.classList.toggle("timeline-fullscreen", isFullscreen);
  fullscreenTimelineButton.textContent = isFullscreen ? "Exit Full Screen" : "Full Screen";
  fullscreenTimelineButton.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenTimelineButton.setAttribute(
    "aria-label",
    isFullscreen ? "Exit full screen timeline view" : "Open timeline in full screen"
  );

  if (isFullscreen) {
    ganttOutput.scrollIntoView({ block: "nearest" });
  }
}

function renderTaskList(validTasks) {
  taskList.innerHTML = "";

  if (!validTasks.length) {
    const empty = document.createElement("div");
    empty.className = "task-empty";
    empty.textContent = "No tasks loaded yet.";
    taskList.appendChild(empty);
    return;
  }

  validTasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-item";

    if (task.milestone) {
      const symbol = document.createElement("span");
      symbol.className = "milestone-symbol";
      symbol.textContent = "◆";
      row.appendChild(symbol);
    }

    row.append(document.createTextNode(task.task));
    taskList.appendChild(row);
  });
}

function renderTimeline(validTasks) {
  gantt.innerHTML = "";

  const allDates = validTasks.flatMap((task) => [new Date(task.start), new Date(task.end)]);
  const minDate = getWeekStart(new Date(Math.min(...allDates)));
  const maxDate = getWeekEnd(new Date(Math.max(...allDates)));

  const totalDays = days(minDate, maxDate) + 1;
  const width = totalDays * pixelsPerDay;

  const header = document.createElement("div");
  header.className = "timeline-header";
  header.style.width = `${width}px`;

  const monthRow = document.createElement("div");
  monthRow.className = "time-row month-row";

  const weekRow = document.createElement("div");
  weekRow.className = "time-row week-row";

  header.append(monthRow, weekRow);

  let cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const start = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const end = monthEnd < maxDate ? monthEnd : maxDate;
    const monthDays = days(start, end) + 1;
    const cell = document.createElement("div");
    cell.className = "time-cell";
    cell.style.width = `${monthDays * pixelsPerDay}px`;
    cell.textContent = start.toLocaleDateString("en", { month: "long", year: "numeric" });
    monthRow.appendChild(cell);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const weekEnd = addDays(cursor, 6);
    const end = weekEnd < maxDate ? weekEnd : maxDate;
    const weekDays = days(cursor, end) + 1;
    const cell = document.createElement("div");
    cell.className = "time-cell";
    cell.style.width = `${weekDays * pixelsPerDay}px`;
    cell.textContent = `W${getWeek(cursor)}`;
    weekRow.appendChild(cell);
    cursor.setDate(cursor.getDate() + 7);
  }

  gantt.appendChild(header);

  const body = document.createElement("div");
  body.className = "gantt-body";
  body.style.width = `${width}px`;

  for (let i = 0; i <= totalDays; i += 1) {
    const line = document.createElement("div");
    line.className = "grid-line";
    line.style.left = `${i * pixelsPerDay}px`;
    body.appendChild(line);
  }

  const today = new Date();
  const todayPos = days(minDate, today);

  if (todayPos > 0 && todayPos < totalDays) {
    const line = document.createElement("div");
    line.className = "today-line";
    line.style.left = `${todayPos * pixelsPerDay}px`;
    body.appendChild(line);
  }

  validTasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-row";

    const start = new Date(task.start);
    const end = new Date(task.end);
    const left = days(minDate, start) * pixelsPerDay;

    if (task.milestone) {
      const milestone = document.createElement("div");
      milestone.className = "milestone";
      milestone.style.left = `${left}px`;
      milestone.setAttribute("aria-label", `${task.task} milestone`);
      row.appendChild(milestone);
    } else {
      const duration = days(start, end) + 1;
      const bar = document.createElement("div");
      bar.className = "task-bar";
      bar.style.left = `${left}px`;
      bar.style.width = `${duration * pixelsPerDay}px`;

      const progress = document.createElement("div");
      progress.className = "progress";
      progress.style.width = `${task.progress}%`;

      const label = document.createElement("div");
      label.className = "task-label";
      label.textContent = `${task.progress}%`;

      bar.append(progress, label);
      row.appendChild(bar);
    }

    body.appendChild(row);
  });

  gantt.appendChild(body);

  timelinePanel.scrollLeft = Math.max(0, (todayPos * pixelsPerDay) - 400);
}

function render() {
  const validTasks = getValidatedTasks();

  if (!validTasks.length) {
    clearError();
    renderTaskList([]);
    gantt.innerHTML = `
      <div class="timeline-empty">
        <div>
          <strong>No timeline data loaded</strong>
          <span>Add a task, load a sample scenario, or import a JSON project file to build the Gantt timeline.</span>
        </div>
      </div>
    `;
    timelinePanel.scrollLeft = 0;
    updateGanttHeight([]);
    return;
  }

  updateGanttHeight(validTasks);
  renderTaskList(validTasks);
  renderTimeline(validTasks);
}

document.getElementById("addTaskButton").addEventListener("click", addTask);
document.getElementById("saveJsonButton").addEventListener("click", saveJSON);
document.getElementById("loadJsonButton").addEventListener("click", loadJSON);

document.querySelectorAll(".sample-plan-button").forEach((button) => {
  button.addEventListener("click", () => loadSamplePlan(button.dataset.sample));
});

fullscreenTimelineButton.addEventListener("click", () => {
  setTimelineFullscreen(!document.body.classList.contains("timeline-fullscreen"));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("timeline-fullscreen")) {
    setTimelineFullscreen(false);
  }
});

taskTableBody.addEventListener("change", (event) => {
  const target = event.target;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;

  if (!Number.isInteger(index) || !field) return;
  updateTask(index, field, target.value);
});

taskTableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-task");
  if (!button) return;
  deleteTask(Number(button.dataset.index));
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("JSON must contain an array of tasks.");

      tasks = parsed.map((task) => ({
        task: String(task.task || "Untitled Task"),
        start: task.start,
        end: task.end,
        progress: Number(task.progress) || 0,
        milestone: Boolean(task.milestone),
      }));

      clearError();
      renderTable();
      render();
    } catch (error) {
      showError("Unable to load this JSON file. Please choose a valid Gantt plan file.");
    } finally {
      fileInput.value = "";
    }
  };

  reader.onerror = () => showError("Unable to read this file. Please try again.");
  reader.readAsText(file);
});

renderTable();
render();
