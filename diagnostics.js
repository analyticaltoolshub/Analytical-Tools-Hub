(function initialiseAthDiagnostics(root) {
  "use strict";

  const LEVEL_LABELS = {
    info: "Information",
    caution: "Caution",
    "high-risk": "High risk",
  };

  function normaliseLevel(level) {
    if (level === "high" || level === "critical" || level === "danger") return "high-risk";
    if (level === "warning") return "caution";
    return ["info", "caution", "high-risk"].includes(level) ? level : "info";
  }

  function appendText(parent, tag, className, text) {
    if (!text) return null;
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function render(container, diagnostics, options = {}) {
    const target = typeof container === "string" ? document.querySelector(container) : container;
    if (!target) return;
    target.textContent = "";
    const items = (diagnostics || []).filter(Boolean).map((item) => ({
      ...item,
      level: normaliseLevel(item.level),
    }));
    if (!items.length) {
      target.hidden = true;
      return;
    }

    target.hidden = false;
    target.className = options.className || "ath-diagnostics";
    if (options.heading) appendText(target, "h3", "ath-diagnostics__heading", options.heading);
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = `ath-diagnostic ath-diagnostic--${item.level}`;
      appendText(card, "span", "ath-diagnostic__level", LEVEL_LABELS[item.level]);
      appendText(card, "strong", "ath-diagnostic__title", item.title);
      appendText(card, "p", null, item.detected ? `Detected: ${item.detected}` : "");
      appendText(card, "p", null, item.why ? `Why it matters: ${item.why}` : "");
      appendText(card, "p", null, item.consider ? `Consider: ${item.consider}` : "");
      target.appendChild(card);
    });
  }

  function summarize(diagnostics) {
    return (diagnostics || [])
      .filter(Boolean)
      .map((item) => {
        const level = LEVEL_LABELS[normaliseLevel(item.level)];
        return `${level}: ${item.title || ""}${item.detected ? ` - ${item.detected}` : ""}`.trim();
      });
  }

  root.ATHDiagnostics = { render, summarize };
}(typeof globalThis !== "undefined" ? globalThis : window));
