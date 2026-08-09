const storageKeys = {
  patients: "dentalSpaPatients",
  finances: "dentalSpaFinances",
  percentages: "dentalSpaPercentages",
  dentists: "dentalSpaDentists",
};

const state = {
  patients: load(storageKeys.patients, []),
  finances: load(storageKeys.finances, []),
  percentages: load(storageKeys.percentages, []),
  dentists: load(storageKeys.dentists, []),
  editingDentistId: null,
  odontogramMarks: {},
  selectedTool: "paint",
  selectedColor: "red",
  financeFilter: "biweekly",
  financeMonth: getMonthValue(new Date()),
  percentageCurrencyMode: "USD",
  lastReport: null,
};

const odontogramRows = [
  {
    type: "adult",
    arch: "upper",
    teeth: ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  },
  {
    type: "child",
    arch: "upper",
    teeth: ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"],
  },
  {
    type: "child",
    arch: "lower",
    teeth: ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"],
  },
  {
    type: "adult",
    arch: "lower",
    teeth: ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
  },
];

const views = {
  registro: "Registro Paciente",
  historial: "Historial",
  odontologas: "Creacion de odontologa",
  balance: "Balance Financiero",
  porcentajes: "Porcentajes",
};

document.addEventListener("DOMContentLoaded", () => {
  setTodayDefaults();
  bindNavigation();
  bindPatientForm();
  bindOdontogramTools();
  bindHistory();
  bindDentists();
  bindFinance();
  bindPercentages();
  addTreatmentRow();
  renderOdontogram();
  renderPatientResults();
  renderDentists();
  renderFinancePatients();
  renderFinance();
  renderPercentageRows();
  renderSavedPercentages();
});

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setTodayDefaults() {
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  document.getElementById("patientDate").value = today;
  document.querySelector('#financeForm input[name="date"]').value = today;
  document.getElementById("financeMonth").value = state.financeMonth;
  document.querySelector('#percentageForm input[name="date"]').value = today;
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link, .view").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.view).classList.add("active");
      document.getElementById("viewTitle").textContent = views[button.dataset.view];
      document.getElementById("appShell").dataset.view = button.dataset.view;
    });
  });
}

function bindPatientForm() {
  const form = document.getElementById("patientForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const patient = Object.fromEntries(formData.entries());
    patient.id = crypto.randomUUID();
    patient.odontogram = structuredClone(state.odontogramMarks);
    patient.treatments = getTreatments();
    patient.evolution = [];

    state.patients.unshift(patient);
    save(storageKeys.patients, state.patients);
    form.reset();
    document.getElementById("treatmentList").innerHTML = "";
    state.odontogramMarks = {};
    setTodayDefaults();
    addTreatmentRow();
    renderOdontogram();
    renderPatientResults();
    renderFinancePatients();
    showStatus("Paciente guardado correctamente.");
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      state.odontogramMarks = {};
      document.getElementById("treatmentList").innerHTML = "";
      setTodayDefaults();
      addTreatmentRow();
      renderOdontogram();
      updateTreatmentTotal();
    }, 0);
  });

  document.getElementById("addTreatment").addEventListener("click", () => addTreatmentRow());
}

function bindOdontogramTools() {
  document.querySelectorAll(".odontogram-tool").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".odontogram-tool").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.selectedTool = button.dataset.tool;
      state.selectedColor = button.dataset.color;
    });
  });
}

function renderOdontogram() {
  const odontogram = document.getElementById("odontogram");
  odontogram.innerHTML = "";

  odontogramRows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = `tooth-row ${row.type} ${row.arch}`;
    row.teeth.forEach((toothId) => rowElement.appendChild(createToothButton(toothId)));
    odontogram.appendChild(rowElement);
  });

  document.getElementById("odontogramInput").value = JSON.stringify(state.odontogramMarks);
}

function createToothButton(toothId) {
  const wrapper = document.createElement("div");
  wrapper.className = "tooth";
  wrapper.innerHTML = `
    <svg class="tooth-chart" viewBox="0 0 100 100" role="group" aria-label="Pieza ${toothId}">
      <circle class="tooth-outline" cx="50" cy="50" r="48"></circle>
      ${toothSectionPath(toothId, "top", "M50 50 L16 16 A48 48 0 0 1 84 16 Z")}
      ${toothSectionPath(toothId, "right", "M50 50 L84 16 A48 48 0 0 1 84 84 Z")}
      ${toothSectionPath(toothId, "bottom", "M50 50 L84 84 A48 48 0 0 1 16 84 Z")}
      ${toothSectionPath(toothId, "left", "M50 50 L16 84 A48 48 0 0 1 16 16 Z")}
      ${toothSectionPath(toothId, "center", "", "circle")}
      ${toothCariesMark(toothId)}
    </svg>
    <span class="tooth-number">${toothId}</span>
  `;
  wrapper.querySelectorAll(".tooth-face").forEach((face) => {
    face.addEventListener("click", () => applyOdontogramTool(toothId, face.dataset.face));
    face.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applyOdontogramTool(toothId, face.dataset.face);
      }
    });
  });
  return wrapper;
}
function toothCariesMark(toothId, marks = state.odontogramMarks) {
  const color = marks?.[toothId]?.caries;
  if (!color) return "";
  return '<g class="tooth-caries-mark ' + color + '" aria-hidden="true"><line class="caries-outline" x1="18" y1="18" x2="82" y2="82"></line><line class="caries-outline" x1="82" y1="18" x2="18" y2="82"></line><line class="caries-line" x1="18" y1="18" x2="82" y2="82"></line><line class="caries-line" x1="82" y1="18" x2="18" y2="82"></line></g>';
}

function applyOdontogramTool(toothId, face) {
  if (state.selectedTool === "caries") {
    toggleToothCaries(toothId);
    return;
  }
  paintToothFace(toothId, face);
}

function toggleToothCaries(toothId) {
  state.odontogramMarks[toothId] = state.odontogramMarks[toothId] || {};
  if (state.odontogramMarks[toothId].caries === state.selectedColor) {
    delete state.odontogramMarks[toothId].caries;
  } else {
    state.odontogramMarks[toothId].caries = state.selectedColor;
  }
  if (Object.keys(state.odontogramMarks[toothId]).length === 0) {
    delete state.odontogramMarks[toothId];
  }
  renderOdontogram();
}

function toothSectionPath(toothId, face, path, shape = "path") {
  const color = state.odontogramMarks[toothId]?.[face] || "";
  const colorClass = color ? ` ${color}` : "";
  const label = `Pieza ${toothId}, cara ${face}`;
  if (shape === "circle") {
    return `<circle class="tooth-face center${colorClass}" data-face="${face}" role="button" tabindex="0" aria-label="${label}" cx="50" cy="50" r="18"></circle>`;
  }
  return `<path class="tooth-face${colorClass}" data-face="${face}" role="button" tabindex="0" aria-label="${label}" d="${path}"></path>`;
}

function paintToothFace(toothId, face) {
  state.odontogramMarks[toothId] = state.odontogramMarks[toothId] || {};
  if (state.odontogramMarks[toothId][face] === state.selectedColor) {
    delete state.odontogramMarks[toothId][face];
  } else {
    state.odontogramMarks[toothId][face] = state.selectedColor;
  }
  if (Object.keys(state.odontogramMarks[toothId]).length === 0) {
    delete state.odontogramMarks[toothId];
  }
  renderOdontogram();
}

function addTreatmentRow(treatment = "", cost = "") {
  const row = document.createElement("div");
  row.className = "treatment-row";
  row.innerHTML = `
    <input class="treatment-name" placeholder="Tratamiento" value="${escapeHtml(treatment)}" />
    <input class="treatment-cost" type="number" min="0" step="0.01" placeholder="Costo USD" value="${escapeHtml(cost)}" />
    <button type="button" class="icon-button" aria-label="Eliminar tratamiento">x</button>
  `;
  row.querySelector(".icon-button").addEventListener("click", () => {
    row.remove();
    updateTreatmentTotal();
  });
  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", updateTreatmentTotal));
  document.getElementById("treatmentList").appendChild(row);
  updateTreatmentTotal();
}

function getTreatments() {
  return Array.from(document.querySelectorAll(".treatment-row"))
    .map((row) => ({
      name: row.querySelector(".treatment-name").value.trim(),
      cost: Number(row.querySelector(".treatment-cost").value || 0),
    }))
    .filter((item) => item.name || item.cost);
}

function updateTreatmentTotal() {
  const total = getTreatments().reduce((sum, item) => sum + item.cost, 0);
  document.getElementById("treatmentTotal").textContent = formatUsd(total);
}

function bindHistory() {
  document.getElementById("patientSearch").addEventListener("input", renderPatientResults);
}

function renderPatientResults() {
  const query = document.getElementById("patientSearch")?.value.toLowerCase().trim() || "";
  const results = document.getElementById("patientResults");
  if (!results) return;

  const matches = state.patients.filter((patient) => {
    return patient.name.toLowerCase().includes(query) || patient.idNumber.toLowerCase().includes(query);
  });

  results.innerHTML = matches.length
    ? ""
    : '<div class="empty-state">No hay pacientes registrados.</div>';

  matches.forEach((patient) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-item";
    button.innerHTML = `
      <span class="patient-avatar">${escapeHtml(getInitial(patient.name))}</span>
      <span class="patient-main">
        <strong>${escapeHtml(patient.name)}</strong>
        <span>CI ${escapeHtml(patient.idNumber || "Sin cedula")} - ${escapeHtml(patient.phone || "Sin telefono")}</span>
      </span>
      <span class="consult-count">${patient.evolution?.length || 0} consultas</span>
    `;
    button.addEventListener("click", () => renderPatientProfile(patient.id));
    results.appendChild(button);
  });
}

function getInitial(value) {
  return String(value || "P").trim().charAt(0).toUpperCase() || "P";
}

function renderPatientProfile(patientId) {
  const patient = state.patients.find((item) => item.id === patientId);
  const profile = document.getElementById("patientProfile");
  if (!patient) return;
  document.getElementById("historyListView").hidden = true;
  document.getElementById("historyDetailView").hidden = false;

  const evolution = patient.evolution?.length
    ? patient.evolution.map((item) => `
      <div class="timeline-item">
        <span class="timeline-dot"></span>
        <div>
          <time>${escapeHtml(item.date)}</time>
          <strong>${escapeHtml(item.procedure || "Consulta")}</strong>
          <p>${escapeHtml(item.note)}</p>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">Sin consultas registradas aun.</div>';
  const treatmentPlan = renderEditableTreatmentPlan(patient.treatments);

  profile.className = "patient-detail";
  profile.innerHTML = `
    <button type="button" class="back-link" id="backToHistory">← Volver al listado</button>

    <header class="patient-detail-header">
      <h1>${escapeHtml(patient.name)}</h1>
      <p>CI ${escapeHtml(patient.idNumber || "Sin cedula")} · ${escapeHtml(patient.age || "Sin edad")} anos</p>
    </header>

    <section class="detail-card">
      <h2>Datos del paciente</h2>
      <div class="detail-grid">
        ${detailField("Telefono", patient.phone)}
        ${detailField("Direccion", patient.address)}
        ${detailField("Grupo sanguineo", patient.bloodGroup)}
        ${detailField("Fecha registro", patient.date)}
        ${detailField("APP", patient.app)}
        ${detailField("APF", patient.apf)}
        ${detailField("AH", patient.ah)}
        ${detailField("RM", patient.rm)}
        ${detailField("Habitos", patient.habits)}
        ${detailField("Examen bucal", patient.oralExam)}
      </div>
    </section>

    <section class="detail-card">
      <h2>Odontodiagrama</h2>
      <div class="readonly-odontogram">${renderReadonlyOdontogram(patient.odontogram)}</div>
    </section>

    <section class="detail-card">
      <h2>Plan de tratamiento</h2>
      ${treatmentPlan}
    </section>

    <section class="detail-card">
      <h2>Evolucion</h2>
      <form class="evolution-form detail-evolution-form">
        <div class="evolution-row">
          <label>Fecha<input type="date" name="date" required value="${new Date().toISOString().slice(0, 10)}" /></label>
          <label>Procedimientos<input name="procedure" placeholder="Ej. Profilaxis, Obturacion 26..." /></label>
        </div>
        <label>Notas / avances<textarea name="note" rows="3" required></textarea></label>
        <button class="primary-button" type="submit">+ Anadir consulta</button>
      </form>
      <div class="evolution-timeline">${evolution}</div>
    </section>
  `;

  document.getElementById("backToHistory").addEventListener("click", () => {
    document.getElementById("historyDetailView").hidden = true;
    document.getElementById("historyListView").hidden = false;
  });
  bindTreatmentPlanEditor(profile, patient);


  profile.querySelector(".evolution-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    patient.evolution = patient.evolution || [];
    patient.evolution.unshift({
      date: data.get("date"),
      procedure: data.get("procedure").trim(),
      note: data.get("note").trim(),
    });
    save(storageKeys.patients, state.patients);
    renderPatientProfile(patient.id);
    renderPatientResults();
  });
}

function profileField(label, value) {
  return `<div><span>${label}</span><strong>${escapeHtml(value || "No registrado")}</strong></div>`;
}

function renderEditableTreatmentPlan(treatments = []) {
  const items = Array.isArray(treatments) ? treatments : [];
  const total = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const rows = items.map((item) => `
    <div class="history-treatment-row">
      <label>Tratamiento<input class="history-treatment-name" value="${escapeHtml(item.name || "")}" placeholder="Ej. Limpieza dental" /></label>
      <label>Costo USD<input class="history-treatment-cost" type="number" min="0" step="0.01" value="${Number(item.cost || 0) || ""}" placeholder="0.00" /></label>
      <button type="button" class="icon-button" data-remove-history-treatment aria-label="Eliminar tratamiento">x</button>
    </div>
  `).join("");

  return `
    <form class="history-treatment-form">
      <div class="history-treatment-list">
        ${rows || '<p class="empty-state compact-visible history-treatment-empty">Sin tratamientos. Agrega uno para comenzar.</p>'}
      </div>
      <div class="history-treatment-toolbar">
        <button type="button" class="ghost-button" data-add-history-treatment>+ Agregar tratamiento</button>
        <div class="history-treatment-total"><span>Total estimado</span><strong data-history-treatment-total>${formatUsd(total)}</strong></div>
      </div>
      <p class="history-treatment-message" aria-live="polite"></p>
      <div class="actions">
        <button type="submit" class="primary-button">Guardar cambios</button>
      </div>
    </form>
  `;
}
function bindTreatmentPlanEditor(profile, patient) {
  const form = profile.querySelector(".history-treatment-form");
  const list = form.querySelector(".history-treatment-list");
  const message = form.querySelector(".history-treatment-message");

  const updateTotal = () => {
    const total = Array.from(list.querySelectorAll(".history-treatment-cost"))
      .reduce((sum, input) => sum + Number(input.value || 0), 0);
    form.querySelector("[data-history-treatment-total]").textContent = formatUsd(total);
  };

  form.addEventListener("input", () => {
    message.textContent = "";
    message.classList.remove("success");
    updateTotal();
  });

  form.addEventListener("click", (event) => {
    if (event.target.closest("[data-add-history-treatment]")) {
      list.querySelector(".history-treatment-empty")?.remove();
      list.insertAdjacentHTML("beforeend", '<div class="history-treatment-row"><label>Tratamiento<input class="history-treatment-name" placeholder="Ej. Limpieza dental" /></label><label>Costo USD<input class="history-treatment-cost" type="number" min="0" step="0.01" placeholder="0.00" /></label><button type="button" class="icon-button" data-remove-history-treatment aria-label="Eliminar tratamiento">x</button></div>');
      const rows = list.querySelectorAll(".history-treatment-row");
      rows[rows.length - 1].querySelector(".history-treatment-name").focus();
    }

    const removeButton = event.target.closest("[data-remove-history-treatment]");
    if (removeButton) {
      removeButton.closest(".history-treatment-row").remove();
      if (!list.querySelector(".history-treatment-row")) {
        list.innerHTML = '<p class="empty-state compact-visible history-treatment-empty">Sin tratamientos. Agrega uno para comenzar.</p>';
      }
      updateTotal();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    patient.treatments = Array.from(list.querySelectorAll(".history-treatment-row"))
      .map((row) => ({
        name: row.querySelector(".history-treatment-name").value.trim(),
        cost: Number(row.querySelector(".history-treatment-cost").value || 0),
      }))
      .filter((item) => item.name || item.cost);
    save(storageKeys.patients, state.patients);
    renderPatientResults();
    message.textContent = "Plan de tratamiento actualizado correctamente.";
    message.classList.add("success");
  });
}

function detailField(label, value) {
  return `<div><span>${label}</span><strong>${escapeHtml(value || "No registrado")}</strong></div>`;
}

function renderReadonlyOdontogram(marks = {}) {
  return odontogramRows.map((row) => {
    const teeth = row.teeth.map((toothId) => `
      <div class="tooth readonly-tooth">
        <svg class="tooth-chart" viewBox="0 0 100 100" role="img" aria-label="Pieza ${toothId}">
          <circle class="tooth-outline" cx="50" cy="50" r="48"></circle>
          ${readonlyToothSection(marks, toothId, "top", "M50 50 L16 16 A48 48 0 0 1 84 16 Z")}
          ${readonlyToothSection(marks, toothId, "right", "M50 50 L84 16 A48 48 0 0 1 84 84 Z")}
          ${readonlyToothSection(marks, toothId, "bottom", "M50 50 L84 84 A48 48 0 0 1 16 84 Z")}
          ${readonlyToothSection(marks, toothId, "left", "M50 50 L16 84 A48 48 0 0 1 16 16 Z")}
          ${readonlyToothSection(marks, toothId, "center", "", "circle")}
          ${toothCariesMark(toothId, marks)}
        </svg>
        <span class="tooth-number">${toothId}</span>
      </div>
    `).join("");
    return `<div class="tooth-row ${row.type} ${row.arch} readonly-row">${teeth}</div>`;
  }).join("");
}

function readonlyToothSection(marks, toothId, face, path, shape = "path") {
  const color = marks?.[toothId]?.[face] || "";
  const colorClass = color ? ` ${color}` : "";
  if (shape === "circle") {
    return `<circle class="tooth-face center${colorClass}" cx="50" cy="50" r="18"></circle>`;
  }
  return `<path class="tooth-face${colorClass}" d="${path}"></path>`;
}

function formatOdontogramMarks(odontogram) {
  if (Array.isArray(odontogram)) {
    return odontogram.join(", ") || "Sin marcas";
  }
  if (!odontogram || typeof odontogram !== "object") {
    return "Sin marcas";
  }

  const faceLabels = {
    top: "superior",
    right: "derecha",
    bottom: "inferior",
    left: "izquierda",
    center: "centro",
  };
  const marks = Object.entries(odontogram).flatMap(([tooth, faces]) => {
    return Object.entries(faces).map(([face, color]) => {
      if (face === "caries") {
        return `${tooth} caries: X ${color === "red" ? "Roja" : "Azul"}`;
      }
      return `${tooth} ${faceLabels[face] || face}: ${color === "red" ? "Rojo" : "Azul"}`;
    });
  });
  return marks.length ? marks.join(", ") : "Sin marcas";
}

function bindPercentages() {
  const form = document.getElementById("percentageForm");
  document.querySelectorAll("[data-percentage-mode]").forEach((button) => {
    button.addEventListener("click", () => setPercentageCurrencyMode(button.dataset.percentageMode));
  });
  document.getElementById("generatePercentages").addEventListener("click", () => renderPercentageRows());
  document.getElementById("addDentistLine").addEventListener("click", addDentistLine);
  form.elements.dentistCount.addEventListener("change", () => renderPercentageRows());
  form.elements.exchangeRate.addEventListener("input", handlePercentageExchangeRateChange);
  document.getElementById("savedPercentages").addEventListener("click", (event) => {
    const report = event.target.closest("[data-report-id]");
    const monthReport = event.target.closest("[data-month-report]");
    const monthToggle = event.target.closest("[data-month-toggle]");
    if (report) openPercentageReport(report.dataset.reportId);
    if (monthReport) openMonthlyPercentageReport(monthReport.dataset.monthReport);
    if (monthToggle) toggleMonthlyReports(monthToggle);
  });
  document.getElementById("percentageReportModal").addEventListener("click", (event) => {
    if (event.target.id === "percentageReportModal" || event.target.closest("[data-close-report-modal]")) {
      closePercentageReport();
    }
    const exportButton = event.target.closest("[data-export-report]");
    if (exportButton) {
      if (exportButton.dataset.exportReport === "excel") exportReportToCsv();
      if (exportButton.dataset.exportReport === "pdf") exportReportToPdf();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePercentageReport();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rows = getPercentageRows();
    const income = rows[0] ? rows[0].amount : 0;
    const incomeVes = rows[0] ? rows[0].amountVes : 0;
    const primaryIncome = state.percentageCurrencyMode === "VES" ? incomeVes : income;

    if (!primaryIncome) {
      setPercentageMessage("Ingresa al menos un monto para guardar el reparto.", true);
      return;
    }

    state.percentages.unshift({
      id: crypto.randomUUID(),
      date: form.elements.date.value,
      income,
      exchangeRate: getExchangeRate(),
      incomeVes,
      currencyMode: state.percentageCurrencyMode,
      rows,
    });
    save(storageKeys.percentages, state.percentages);
    renderSavedPercentages();
    clearPercentageInputs();
    setPercentageMessage("Reparto guardado correctamente.");
  });
  setPercentageCurrencyMode(state.percentageCurrencyMode);
}

function renderPercentageRows() {
  const form = document.getElementById("percentageForm");
  const dentistIds = getActiveDentistIds();
  const body = document.getElementById("percentageRows");
  const previous = getPercentageRows();
  const previousById = new Map(previous.slice(1).filter((row) => row.dentistId).map((row) => [row.dentistId, row]));
  body.innerHTML = "";

  createPercentageRow(body, previous[0] || { name: "Clinica", amount: 0 }, true);
  dentistIds.forEach((dentistId) => {
    createPercentageRow(body, previousById.get(dentistId) || { name: dentistId, dentistId, amount: 0 });
  });
  form.elements.dentistCount.value = dentistIds.length;
  updatePercentageTotals();
}
function getActiveDentists() {
  return state.dentists.filter((dentist) => dentist.status === "active");
}

function getActiveDentistIds() {
  return getActiveDentists().map((dentist) => dentist.id);
}

function renderDentistOptions(selectedId) {
  const options = getActiveDentists().map((dentist) => {
    const percentage = Number(dentist.percentage) || 0;
    const label = `${dentist.name || dentist.id} (${percentage}%)`;
    const selected = dentist.id === selectedId ? " selected" : "";
    return `<option value="${escapeHtml(dentist.id)}"${selected}>${escapeHtml(label)}</option>`;
  }).join("");
  return `<option value="">Selecciona odontologa...</option>${options}`;
}

function createPercentageRow(body, row, clinic = false) {
  const element = document.createElement("tr");
  element.dataset.clinic = clinic ? "true" : "false";
  const beneficiaryCell = clinic
    ? `<input class="percentage-name" value="${escapeHtml(row.name)}" aria-label="Clinica" />`
    : `<select class="percentage-name percentage-dentist-select" aria-label="Odontologa">${renderDentistOptions(row.dentistId)}</select>`;
  element.innerHTML = `
    <td>${beneficiaryCell}</td>
    <td><input class="percentage-amount-input" type="number" min="0" step="any" inputmode="decimal" value="${row.amount ? Number(row.amount) : ""}" aria-label="Ingreso USD" ${clinic ? "" : "readonly"} /></td>
    <td><input class="percentage-ves-input" type="number" min="0" step="any" inputmode="decimal" value="${row.amountVes ? Number(row.amountVes) : ""}" aria-label="Ingreso VES" ${clinic ? "" : "readonly"} /></td>
    <td class="percentage-row-total"></td>
    <td class="percentage-row-actions">${clinic ? '<span class="not-applicable" aria-label="No aplica">-</span>' : '<button type="button" class="remove-dentist-button">Quitar</button>'}</td>
  `;
  element.querySelector(".percentage-amount-input").addEventListener("input", () => {
    if (state.percentageCurrencyMode === "USD") syncVesFromUsd(element);
    if (clinic) recomputeAllDentistRows();
    updatePercentageTotals();
  });
  element.querySelector(".percentage-ves-input").addEventListener("input", () => {
    if (state.percentageCurrencyMode === "VES") syncUsdFromVes(element);
    if (clinic) recomputeAllDentistRows();
    updatePercentageTotals();
  });
  configurePercentageRowInputs(element);
  if (clinic) {
    element.querySelector(".percentage-name").addEventListener("input", updatePercentageTotals);
  } else {
    element.querySelector(".percentage-dentist-select").addEventListener("change", () => {
      recomputeDentistRow(element);
      updatePercentageTotals();
    });
    element.querySelector(".remove-dentist-button").addEventListener("click", () => {
      element.remove();
      updateDentistCount();
      updatePercentageTotals();
    });
    recomputeDentistRow(element);
  }
  body.appendChild(element);
}

function recomputeDentistRow(element) {
  const select = element.querySelector(".percentage-dentist-select");
  const dentist = state.dentists.find((item) => item.id === select.value);
  const percentage = dentist ? Math.min(100, Math.max(0, Number(dentist.percentage) || 0)) : 0;
  const usdInput = element.querySelector(".percentage-amount-input");
  const vesInput = element.querySelector(".percentage-ves-input");
  const clinicRow = document.querySelector('#percentageRows tr[data-clinic="true"]');
  if (!clinicRow) {
    usdInput.value = "";
    vesInput.value = "";
    return;
  }
  const clinicUsd = Number(clinicRow.querySelector(".percentage-amount-input").value || 0);
  const clinicVes = Number(clinicRow.querySelector(".percentage-ves-input").value || 0);
  usdInput.value = clinicUsd ? (clinicUsd * percentage / 100).toFixed(2) : "";
  vesInput.value = clinicVes ? (clinicVes * percentage / 100).toFixed(2) : "";
}

function recomputeAllDentistRows() {
  document.querySelectorAll('#percentageRows tr[data-clinic="false"]').forEach(recomputeDentistRow);
}

function addDentistLine() {
  const body = document.getElementById("percentageRows");
  const usedIds = new Set(Array.from(body.querySelectorAll('tr[data-clinic="false"] .percentage-dentist-select')).map((select) => select.value));
  const dentistId = getActiveDentistIds().find((id) => !usedIds.has(id)) || "";
  createPercentageRow(body, { name: dentistId, dentistId, amount: 0 });
  updateDentistCount();
  updatePercentageTotals();
}

function updateDentistCount() {
  const count = document.querySelectorAll('#percentageRows tr[data-clinic="false"]').length;
  document.querySelector('#percentageForm input[name="dentistCount"]').value = count;
}

function clearPercentageInputs() {
  const form = document.getElementById("percentageForm");
  form.elements.exchangeRate.value = "";
  const body = document.getElementById("percentageRows");
  body.innerHTML = "";
  renderPercentageRows();
}

function setPercentageCurrencyMode(mode) {
  state.percentageCurrencyMode = mode === "VES" ? "VES" : "USD";
  const isVesMode = state.percentageCurrencyMode === "VES";
  const form = document.getElementById("percentageForm");
  form.dataset.currencyMode = state.percentageCurrencyMode;
  document.getElementById("percentageModeLabel").textContent = isVesMode ? "Bol\u00edvares" : "D\u00f3lares";
  document.getElementById("percentageUsdHeader").textContent = isVesMode ? "Ingreso USD (calculado)" : "Ingreso USD";
  document.getElementById("percentageVesHeader").textContent = isVesMode ? "Ingreso VES" : "Ingreso VES (calculado)";

  document.querySelectorAll("[data-percentage-mode]").forEach((button) => {
    const isActive = button.dataset.percentageMode === state.percentageCurrencyMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll('#percentageRows tr[data-clinic="true"]').forEach((row) => {
    configurePercentageRowInputs(row);
    if (isVesMode) {
      syncUsdFromVes(row, true);
    } else {
      syncVesFromUsd(row);
    }
  });
  document.querySelectorAll('#percentageRows tr[data-clinic="false"]').forEach(configurePercentageRowInputs);
  recomputeAllDentistRows();
  updatePercentageTotals();
}

function configurePercentageRowInputs(row) {
  if (row.dataset.clinic !== "true") {
    row.querySelector(".percentage-amount-input").readOnly = true;
    row.querySelector(".percentage-ves-input").readOnly = true;
    return;
  }
  const isVesMode = state.percentageCurrencyMode === "VES";
  row.querySelector(".percentage-amount-input").readOnly = isVesMode;
  row.querySelector(".percentage-ves-input").readOnly = !isVesMode;
}

function handlePercentageExchangeRateChange() {
  document.querySelectorAll('#percentageRows tr[data-clinic="true"]').forEach((row) => {
    if (state.percentageCurrencyMode === "VES") {
      syncUsdFromVes(row, true);
    } else {
      syncVesFromUsd(row);
    }
  });
  recomputeAllDentistRows();
  updatePercentageTotals();
}

function getPercentageRows() {
  const exchangeRate = getExchangeRate();
  const isVesMode = state.percentageCurrencyMode === "VES";
  const rows = Array.from(document.querySelectorAll("#percentageRows tr[data-clinic]")).map((row) => {
    const isClinic = row.dataset.clinic === "true";
    const amountInput = Number(row.querySelector(".percentage-amount-input").value || 0);
    const amountVesInput = Number(row.querySelector(".percentage-ves-input").value || 0);
    let name;
    let dentistId = null;
    if (isClinic) {
      name = row.querySelector(".percentage-name").value.trim() || "Clinica";
    } else {
      const select = row.querySelector(".percentage-dentist-select");
      dentistId = select ? select.value : "";
      const dentist = state.dentists.find((item) => item.id === dentistId);
      name = dentist ? dentist.name || dentist.id : "Sin asignar";
    }
    return {
      name,
      dentistId,
      amount: isVesMode ? (exchangeRate ? amountVesInput / exchangeRate : 0) : amountInput,
      amountVes: isVesMode ? amountVesInput : amountInput * exchangeRate,
    };
  });
  const clinicBase = rows[0] ? (isVesMode ? rows[0].amountVes : rows[0].amount) : 0;
  return rows.map((row) => ({
    ...row,
    percentage: clinicBase ? (isVesMode ? row.amountVes : row.amount) / clinicBase * 100 : 0,
  }));
}

function getExchangeRate() {
  return Math.max(0, Number(document.querySelector('#percentageForm input[name="exchangeRate"]').value || 0));
}

function syncVesFromUsd(row) {
  const usdInput = row.querySelector(".percentage-amount-input");
  const vesInput = row.querySelector(".percentage-ves-input");
  if (!usdInput.value) {
    vesInput.value = "";
    return;
  }

  vesInput.value = (Number(usdInput.value) * getExchangeRate()).toFixed(2);
}

function syncUsdFromVes(row, silent = false) {
  const exchangeRate = getExchangeRate();
  if (!exchangeRate) {
    if (!silent) setPercentageMessage("Indica una tasa de cambio para convertir el ingreso VES a USD.", true);
    return false;
  }

  const vesInput = row.querySelector(".percentage-ves-input");
  const usdInput = row.querySelector(".percentage-amount-input");
  if (!vesInput.value) {
    usdInput.value = "";
    return true;
  }

  usdInput.value = String(Number(vesInput.value) / exchangeRate);
  return true;
}

function updatePercentageTotals() {
  const rows = getPercentageRows();

  const clinicRow = document.querySelector('#percentageRows tr[data-clinic="true"]');
  if (clinicRow) {
    const usdInput = clinicRow.querySelector(".percentage-amount-input");
    const vesInput = clinicRow.querySelector(".percentage-ves-input");
    if (state.percentageCurrencyMode === "VES") {
      usdInput.value = vesInput.value && getExchangeRate() ? rows[0].amount.toFixed(2) : "";
    } else {
      vesInput.value = usdInput.value ? rows[0].amountVes.toFixed(2) : "";
    }
  }

  renderPercentageSummary(rows);
  const primaryTotal = state.percentageCurrencyMode === "VES" ? rows[0]?.amountVes : rows[0]?.amount;
  const primaryCurrency = state.percentageCurrencyMode === "VES" ? "bolivares" : "dolares";
  const message = primaryTotal
    ? `Modo ${primaryCurrency}: la otra moneda se calcula automaticamente con la tasa de cambio.`
    : `Ingresa los montos en ${primaryCurrency}. Los totales se muestran a la derecha.`;
  setPercentageMessage(message);
}

function renderPercentageSummary(rows) {
  const body = document.getElementById("percentageRows");
  const tableRows = Array.from(body.querySelectorAll("tr[data-clinic]"));

  tableRows.forEach((row, index) => {
    const item = rows[index] || { name: "Sin nombre", amount: 0, amountVes: 0, percentage: 0 };
    const label = index === 0 ? "Total clinica" : "Total " + (item.name === "Sin nombre" ? index : item.name);
    row.querySelector(".percentage-row-total").innerHTML = renderInlinePercentageTotal(label, item.amount, item.amountVes, item.percentage || 0);
  });
}

function renderInlinePercentageTotal(label, amount, amountVes, percentage) {
  return '<div class="percentage-inline-total"><div><strong>' + escapeHtml(label) + '</strong><b>' + percentage.toFixed(2) + '%</b></div><span>' + formatUsd(amount) + ' / ' + formatVes(amountVes) + '</span></div>';
}

function setPercentageMessage(message, isError = false) {
  const element = document.getElementById("percentageMessage");
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function renderSavedPercentages() {
  const list = document.getElementById("savedPercentages");
  if (!state.percentages.length) {
    list.innerHTML = '<div class="empty-state compact-visible">No hay repartos guardados.</div>';
    return;
  }
  const groups = groupReportsByMonth(state.percentages);
  if (groups.length) {
    list.innerHTML = groups.map((group) => `
      <section class="monthly-report-group">
        <header class="monthly-report-header">
          <button type="button" class="monthly-report-toggle" data-month-toggle="monthly-reports-${group.key}" aria-expanded="false">
            <span class="monthly-report-label"><strong>${escapeHtml(group.label)}</strong><span>${group.range}</span></span>
            <span class="monthly-report-chevron" aria-hidden="true">+</span>
          </button>
          <button type="button" class="monthly-report-button" data-month-report="${group.key}">Reporte general del mes</button>
        </header>
        <div id="monthly-reports-${group.key}" class="monthly-report-items" hidden>
          ${group.entries.map((entry) => `
            <button type="button" class="saved-percentage-item" data-report-id="${entry.id}">
              <div><strong>${escapeHtml(entry.date)}</strong><span>${entry.rows.length - 1} odontologas</span></div>
              <strong>${formatUsd(entry.income)} - ${formatVes(entry.incomeVes || 0)}</strong>
            </button>
          `).join("")}
        </div>
      </section>
    `).join("");
    return;
  }
  list.innerHTML = state.percentages.map((entry) => `
    <button type="button" class="saved-percentage-item" data-report-id="${entry.id}">
      <div><strong>${escapeHtml(entry.date)}</strong><span>${entry.rows.length - 1} odontologas</span></div>
      <strong>${formatUsd(entry.income)} · ${formatVes(entry.incomeVes || 0)}</strong>
    </button>
  `).join("");
}

function groupReportsByMonth(reports) {
  const groups = new Map();
  reports.forEach((entry) => {
    const key = String(entry.date || "").slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  });

  return Array.from(groups.entries()).sort(([first], [second]) => second.localeCompare(first)).map(([key, entries]) => ({
    key,
    entries,
    ...getMonthMetadata(key),
  }));
}

function getMonthMetadata(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const date = new Date(Date.UTC(year, month - 1, 1));
  const label = new Intl.DateTimeFormat("es-VE", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  const formattedMonth = String(month).padStart(2, "0");
  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    range: `01/${formattedMonth}/${year} - ${String(lastDay).padStart(2, "0")}/${formattedMonth}/${year}`,
  };
}

function toggleMonthlyReports(toggle) {
  const content = document.getElementById(toggle.dataset.monthToggle);
  if (!content) return;
  const isExpanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!isExpanded));
  toggle.querySelector(".monthly-report-chevron").textContent = isExpanded ? "+" : "-";
  content.hidden = isExpanded;
}

function openPercentageReport(reportId) {
  const entry = state.percentages.find((report) => report.id === reportId);
  if (!entry) return;

  const exchangeRate = Number(entry.exchangeRate || 0);
  const rows = entry.rows.map((row) => ({
    name: row.name || "Sin nombre",
    amount: Number(row.amount || 0),
    amountVes: Number(row.amountVes ?? Number(row.amount || 0) * exchangeRate),
    percentage: row.percentage == null ? null : Number(row.percentage),
  }));
  const currencyMode = entry.currencyMode === "VES" ? "VES" : "USD";

  const title = "Reporte del d\u00eda";
  const reportMode = entry.currencyMode === "VES" ? "Bol\u00edvares" : "D\u00f3lares";
  const subtitle = `Fecha: ${entry.date} - Modo: ${reportMode}${exchangeRate ? ` - Tasa: ${formatVes(exchangeRate)} por USD` : ""}`;
  document.getElementById("percentageReportTitle").textContent = title;
  document.getElementById("percentageReportSubtitle").textContent = subtitle;
  document.getElementById("percentageReportContent").innerHTML = renderStructuredPercentageReport(rows, currencyMode);
  state.lastReport = { title, subtitle, rows, currencyMode, filename: `reporte-dia-${entry.date}` };
  document.getElementById("percentageReportModal").hidden = false;
}

function openMonthlyPercentageReport(monthKey) {
  const entries = state.percentages.filter((entry) => String(entry.date || "").startsWith(monthKey));
  if (!entries.length) return;

  const clinic = { name: "Clinica", amount: 0, amountVes: 0, primaryUsd: 0, primaryVes: 0 };
  const dentists = new Map();
  entries.forEach((entry) => {
    const exchangeRate = Number(entry.exchangeRate || 0);
    const currencyMode = entry.currencyMode === "VES" ? "VES" : "USD";
    const rows = entry.rows.map((row) => {
      const amount = Number(row.amount || 0);
      const amountVes = Number(row.amountVes ?? amount * exchangeRate);
      return {
        name: row.name || "Sin nombre",
        amount,
        amountVes,
        primaryUsd: currencyMode === "USD" ? amount : 0,
        primaryVes: currencyMode === "VES" ? amountVes : 0,
      };
    });
    if (rows[0]) {
      clinic.amount += rows[0].amount;
      clinic.amountVes += rows[0].amountVes;
      clinic.primaryUsd += rows[0].primaryUsd;
      clinic.primaryVes += rows[0].primaryVes;
    }
    rows.slice(1).forEach((dentist, index) => {
      const name = dentist.name === "Sin nombre" ? `Odontologa ${index + 1}` : dentist.name;
      const total = dentists.get(name) || { name, amount: 0, amountVes: 0, primaryUsd: 0, primaryVes: 0 };
      total.amount += dentist.amount;
      total.amountVes += dentist.amountVes;
      total.primaryUsd += dentist.primaryUsd;
      total.primaryVes += dentist.primaryVes;
      dentists.set(name, total);
    });
  });

  const rows = [clinic, ...dentists.values()];
  const modes = new Set(entries.map((entry) => entry.currencyMode === "VES" ? "VES" : "USD"));
  const currencyMode = modes.size > 1 ? "MIXED" : Array.from(modes)[0];
  const metadata = getMonthMetadata(monthKey);
  const title = "Reporte general mensual";
  const currencySummary = currencyMode === "MIXED" ? "D\u00f3lares y Bol\u00edvares" : (currencyMode === "VES" ? "Bol\u00edvares" : "D\u00f3lares");
  const subtitle = `Periodo: ${metadata.range} - ${entries.length} repartos - Moneda: ${currencySummary}`;
  document.getElementById("percentageReportTitle").textContent = title;
  document.getElementById("percentageReportSubtitle").textContent = subtitle;
  document.getElementById("percentageReportContent").innerHTML = renderStructuredPercentageReport(rows, currencyMode);
  state.lastReport = { title, subtitle, rows, currencyMode, filename: `reporte-mensual-${monthKey}` };
  document.getElementById("percentageReportModal").hidden = false;
}

function renderStructuredPercentageReport(rows, currencyMode) {
  const clinicRow = rows[0] || { amount: 0, amountVes: 0 };
  const amountHeader = currencyMode === "MIXED" ? "Ingresos USD / VES" : (currencyMode === "VES" ? "Ingreso VES" : "Ingreso USD");

  return `
    <div class="report-table-wrap structured-report-wrap">
      <table class="report-table structured-report-table" data-report-currency="${currencyMode}">
        <thead>
          <tr><th>Beneficiario</th><th>${amountHeader}</th><th>Totales</th></tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => {
            const totalLabel = index === 0 ? "Total clinica" : `Total ${row.name === "Sin nombre" ? index : row.name}`;
            const percentageText = getStructuredReportPercentage(row, currencyMode, clinicRow);
            return `<tr>
              <td><div class="report-beneficiary-box">${escapeHtml(row.name)}</div></td>
              <td>${renderReportPrimaryAmount(row, currencyMode)}</td>
              <td class="structured-report-total-cell">${renderStructuredReportTotal(totalLabel, row.amount, row.amountVes, percentageText)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getReportPrimaryUsd(row, currencyMode) {
  if (row.primaryUsd != null) return Number(row.primaryUsd || 0);
  return currencyMode === "USD" ? Number(row.amount || 0) : 0;
}

function getReportPrimaryVes(row, currencyMode) {
  if (row.primaryVes != null) return Number(row.primaryVes || 0);
  return currencyMode === "VES" ? Number(row.amountVes || 0) : 0;
}

function renderReportPrimaryAmount(row, currencyMode) {
  const primaryUsd = getReportPrimaryUsd(row, currencyMode);
  const primaryVes = getReportPrimaryVes(row, currencyMode);
  if (currencyMode === "MIXED") {
    return `<div class="report-mixed-amount">
      <span><small>D\u00f3lares</small><strong>${formatUsd(primaryUsd)}</strong></span>
      <span><small>Bol\u00edvares</small><strong>${formatVes(primaryVes)}</strong></span>
    </div>`;
  }
  return `<div class="report-single-amount">${currencyMode === "VES" ? formatVes(primaryVes) : formatUsd(primaryUsd)}</div>`;
}

function getStructuredReportPercentage(row, currencyMode, clinicRow) {
  if (currencyMode === "MIXED") {
    const percentages = [];
    if (clinicRow.amount) percentages.push(`USD ${(row.amount / clinicRow.amount * 100).toFixed(2)}%`);
    if (clinicRow.amountVes) percentages.push(`VES ${(row.amountVes / clinicRow.amountVes * 100).toFixed(2)}%`);
    return percentages.length ? percentages.join(" ? ") : "0.00%";
  }
  const total = currencyMode === "VES" ? clinicRow.amountVes : clinicRow.amount;
  const amount = currencyMode === "VES" ? row.amountVes : row.amount;
  return `${(total ? amount / total * 100 : 0).toFixed(2)}%`;
}

function renderStructuredReportTotal(label, amount, amountVes, percentageText) {
  return `<div class="percentage-inline-total structured-report-total">
    <div><strong>${escapeHtml(label)}</strong><b>${escapeHtml(percentageText)}</b></div>
    <span>${formatUsd(Number(amount || 0))} / ${formatVes(Number(amountVes || 0))}</span>
  </div>`;
}

function closePercentageReport() {
  document.getElementById("percentageReportModal").hidden = true;
}

function exportReportToCsv() {
  const report = state.lastReport;
  if (!report) return;
  const clinicRow = report.rows[0] || { amount: 0, amountVes: 0 };
  const header = ["Beneficiario", "Ingreso USD", "Ingreso VES", "Porcentaje"];
  const lines = [header.map(csvEscape).join(",")];
  report.rows.forEach((row, index) => {
    const label = index === 0 ? "Total clinica" : row.name;
    const percentageText = getStructuredReportPercentage(row, report.currencyMode, clinicRow);
    lines.push([
      csvEscape(label),
      Number(row.amount || 0).toFixed(2),
      Number(row.amountVes || 0).toFixed(2),
      csvEscape(percentageText),
    ].join(","));
  });
  downloadBlob("﻿" + lines.join("\r\n"), `${report.filename}.csv`, "text/csv;charset=utf-8;");
}

function exportReportToPdf() {
  const report = state.lastReport;
  if (!report) return;
  const clinicRow = report.rows[0] || { amount: 0, amountVes: 0 };
  const rowsHtml = report.rows.map((row, index) => {
    const label = index === 0 ? "Total clinica" : row.name;
    const percentageText = getStructuredReportPercentage(row, report.currencyMode, clinicRow);
    return `<tr>
      <td>${escapeHtml(label)}</td>
      <td>${formatUsd(Number(row.amount || 0))}</td>
      <td>${formatVes(Number(row.amountVes || 0))}</td>
      <td>${escapeHtml(percentageText)}</td>
    </tr>`;
  }).join("");

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    setPercentageMessage("El navegador bloqueo la ventana de impresion. Habilita las ventanas emergentes.", true);
    return;
  }
  printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(report.title)}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
  h1 { font-size: 1.3rem; margin-bottom: 4px; }
  p { color: #475569; margin-top: 0; }
  table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 0.9rem; }
  th { background: #f1f5f9; }
</style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p>${escapeHtml(report.subtitle)}</p>
  <table>
    <thead><tr><th>Beneficiario</th><th>Ingreso USD</th><th>Ingreso VES</th><th>Porcentaje</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function bindDentists() {
  const form = document.getElementById("dentistForm");
  const list = document.getElementById("dentistList");

  form.addEventListener("input", () => setDentistMessage(""));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const id = String(data.get("id") || "").trim();
    const name = String(data.get("name") || "").trim();
    const percentage = Math.min(100, Math.max(0, Number(data.get("percentage")) || 0));
    const status = data.get("status") === "inactive" ? "inactive" : "active";
    const duplicate = state.dentists.some((dentist) => {
      return dentist.id.toLowerCase() === id.toLowerCase() && dentist.id !== state.editingDentistId;
    });

    if (duplicate) {
      setDentistMessage("Ya existe una odontologa con ese ID.", true);
      return;
    }

    const wasEditing = Boolean(state.editingDentistId);
    if (wasEditing) {
      const index = state.dentists.findIndex((dentist) => dentist.id === state.editingDentistId);
      if (index >= 0) {
        state.dentists[index] = { id, name, percentage, status };
      }
    } else {
      state.dentists.unshift({ id, name, percentage, status });
    }

    save(storageKeys.dentists, state.dentists);
    resetDentistForm();
    renderDentists();
    renderPercentageRows();
    setDentistMessage(wasEditing ? "Odontologa actualizada correctamente." : "Odontologa creada correctamente.");
  });

  document.getElementById("cancelDentistEdit").addEventListener("click", resetDentistForm);

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dentist-action]");
    if (!button) return;
    const card = button.closest(".dentist-card");
    const dentistId = card.dataset.dentistId;
    const dentist = state.dentists.find((item) => item.id === dentistId);
    if (!dentist) return;

    if (button.dataset.dentistAction === "edit") {
      state.editingDentistId = dentist.id;
      form.elements.id.value = dentist.id;
      form.elements.name.value = dentist.name;
      form.elements.percentage.value = dentist.percentage ?? "";
      form.elements.status.value = dentist.status;
      document.getElementById("dentistFormTitle").textContent = "Editar odontologa";
      document.getElementById("saveDentist").textContent = "Guardar cambios";
      document.getElementById("cancelDentistEdit").hidden = false;
      setDentistMessage("Editando a " + dentist.name + ".");
      form.elements.id.focus();
      return;
    }

    if (button.dataset.dentistAction === "delete") {
      if (!window.confirm("Eliminar a " + dentist.name + "? Esta accion no se puede deshacer.")) return;
      state.dentists = state.dentists.filter((item) => item.id !== dentist.id);
      save(storageKeys.dentists, state.dentists);
      if (state.editingDentistId === dentist.id) resetDentistForm();
      renderDentists();
      renderPercentageRows();
      setDentistMessage("Odontologa eliminada correctamente.");
    }
  });
}

function resetDentistForm() {
  const form = document.getElementById("dentistForm");
  state.editingDentistId = null;
  form.reset();
  document.getElementById("dentistFormTitle").textContent = "Nueva odontologa";
  document.getElementById("saveDentist").textContent = "Crear odontologa";
  document.getElementById("cancelDentistEdit").hidden = true;
  setDentistMessage("");
}

function setDentistMessage(message, isError = false) {
  const element = document.getElementById("dentistMessage");
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.classList.toggle("success", Boolean(message) && !isError);
}

function renderDentists() {
  const list = document.getElementById("dentistList");
  document.getElementById("dentistCount").textContent = state.dentists.length + (state.dentists.length === 1 ? " registro" : " registros");
  list.innerHTML = "";

  if (!state.dentists.length) {
    list.innerHTML = '<div class="empty-state compact-visible">No hay odontologas registradas.</div>';
    return;
  }

  state.dentists.forEach((dentist) => {
    const card = document.createElement("article");
    card.className = "dentist-card";
    card.dataset.dentistId = dentist.id;
    const isActive = dentist.status === "active";
    card.innerHTML = '<div class="dentist-card-main"><strong>' + escapeHtml(dentist.name) + '</strong><span>ID: ' + escapeHtml(dentist.id) + '</span></div><span class="dentist-percentage">' + (dentist.percentage ?? 0) + '%</span><span class="dentist-status ' + (isActive ? "active" : "inactive") + '">' + (isActive ? "Activa" : "Inactiva") + '</span><div class="dentist-card-actions"><button type="button" class="ghost-button" data-dentist-action="edit">Editar</button><button type="button" class="danger-button" data-dentist-action="delete">Eliminar</button></div>';
    list.appendChild(card);
  });
}
function bindFinance() {
  renderFinanceCategories();
  document.querySelector('#financeForm select[name="type"]').addEventListener("change", renderFinanceCategories);
  const monthInput = document.getElementById("financeMonth");
  renderFinanceMonthOptions();
  monthInput.value = state.financeMonth;
  monthInput.addEventListener("change", () => {
    state.financeMonth = monthInput.value || getMonthValue(new Date());
    monthInput.value = state.financeMonth;
    renderFinance();
  });
  const patientSearch = document.getElementById("financePatientSearch");
  patientSearch.addEventListener("input", renderFinancePatients);
  patientSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const matches = getFinancePatientMatches(patientSearch.value);
    renderFinancePatients();
    if (matches.length === 1) {
      document.getElementById("financePatient").value = matches[0].id;
    }
  });

  document.getElementById("financeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const amountUsd = Number(data.amountUsd || 0);
    const amountVes = Number(data.amountVes || 0);
    if (!amountUsd && !amountVes) {
      showStatus("Agrega un monto USD o VES.");
      return;
    }
    state.finances.unshift({
      id: crypto.randomUUID(),
      type: data.type,
      description: data.description,
      category: data.category,
      date: data.date,
      amountUsd,
      amountVes,
      patientId: data.patientId,
    });
    save(storageKeys.finances, state.finances);
    event.currentTarget.reset();
    setTodayDefaults();
    renderFinanceCategories();
    renderFinancePatients();
    renderFinanceMonthOptions();
    renderFinance();
  });

  document.querySelectorAll(".finance-filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".finance-filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.financeFilter = button.dataset.filter;
      renderFinance();
    });
  });
}

function renderFinanceCategories() {
  const form = document.getElementById("financeForm");
  const select = document.getElementById("financeCategory");
  if (!form || !select) return;

  const categories = form.elements.type.value === "income"
    ? [
        ["consulta", "Consulta / paciente"],
        ["compra_divisas", "Compra de divisas"],
        ["otro_ingreso", "Otro ingreso"],
      ]
    : [
        ["gasto_operativo", "Gasto operativo"],
        ["venta_bolivares", "Venta de bolivares"],
        ["otro_egreso", "Otro egreso"],
      ];

  select.innerHTML = categories
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join("");
}

function renderFinancePatients() {
  const select = document.getElementById("financePatient");
  if (!select) return;
  const searchInput = document.getElementById("financePatientSearch");
  const query = normalizePatientId(searchInput?.value);
  const selectedPatientId = select.value;
  const matches = getFinancePatientMatches(query);

  select.innerHTML = '<option value="">Sin asociar</option>';
  matches.forEach((patient) => {
    const option = document.createElement("option");
    option.value = patient.id;
    option.textContent = `${patient.name} - ${patient.idNumber || "Sin cedula"}`;
    select.appendChild(option);
  });
  if (query && !matches.length) {
    const option = document.createElement("option");
    option.disabled = true;
    option.textContent = "No se encontro paciente con esa cedula";
    select.appendChild(option);
  }
  select.value = matches.some((patient) => patient.id === selectedPatientId) ? selectedPatientId : "";
}

function getFinancePatientMatches(query) {
  const normalizedQuery = normalizePatientId(query);
  return state.patients.filter((patient) => normalizePatientId(patient.idNumber).includes(normalizedQuery));
}

function normalizePatientId(value) {
  return String(value || "").replace(/\D/g, "");
}

function renderFinance() {
  const filtered = state.finances.filter((item) => isInsideSelectedPeriod(item.date, state.financeFilter, state.financeMonth));
  const totals = { incomeUsd: 0, expenseUsd: 0, incomeVes: 0, expenseVes: 0 };

  filtered.forEach((item) => {
    const amountUsd = getFinanceAmount(item, "USD");
    const amountVes = getFinanceAmount(item, "VES");
    if (item.type === "income") {
      totals.incomeUsd += amountUsd;
      totals.incomeVes += amountVes;
    } else {
      totals.expenseUsd += amountUsd;
      totals.expenseVes += amountVes;
    }
  });

  document.getElementById("incomeUsd").textContent = formatUsd(totals.incomeUsd);
  document.getElementById("expenseUsd").textContent = formatUsd(totals.expenseUsd);
  document.getElementById("balanceUsd").textContent = formatUsd(totals.incomeUsd - totals.expenseUsd);
  document.getElementById("incomeVes").textContent = formatVes(totals.incomeVes);
  document.getElementById("expenseVes").textContent = formatVes(totals.expenseVes);
  document.getElementById("balanceVes").textContent = formatVes(totals.incomeVes - totals.expenseVes);

  const list = document.getElementById("financeList");
  list.innerHTML = filtered.length ? "" : '<div class="empty-state">Sin movimientos en este periodo.</div>';
  filtered.forEach((item) => {
    const movement = document.createElement("div");
    movement.className = "movement";
    const patient = state.patients.find((entry) => entry.id === item.patientId);
    movement.innerHTML = `
      <div><strong>${escapeHtml(item.description)}</strong><span>${escapeHtml(item.date)} - ${item.type === "income" ? "Ingreso" : "Egreso"} - ${escapeHtml(getFinanceCategoryLabel(item))}${patient ? ` - ${escapeHtml(patient.name)}` : ""}</span></div>
      <strong>${formatUsd(getFinanceAmount(item, "USD"))} - ${formatVes(getFinanceAmount(item, "VES"))}</strong>
    `;
    list.appendChild(movement);
  });
}

function getFinanceCategoryLabel(item) {
  const labels = {
    consulta: "Consulta / paciente",
    compra_divisas: "Compra de divisas",
    otro_ingreso: "Otro ingreso",
    gasto_operativo: "Gasto operativo",
    venta_bolivares: "Venta de bolivares",
    otro_egreso: "Otro egreso",
  };
  return labels[item.category] || "Sin categoria";
}

function getFinanceAmount(item, currency) {
  if (currency === "USD") {
    return Number(item.amountUsd ?? (item.currency === "USD" ? item.amount : 0) ?? 0);
  }
  return Number(item.amountVes ?? (item.currency === "VES" ? item.amount : 0) ?? 0);
}

function getMonthValue(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0")].join("-");
}

function renderFinanceMonthOptions() {
  const select = document.getElementById("financeMonth");
  if (!select) return;
  const currentMonth = getMonthValue(new Date());
  const months = new Set([state.financeMonth, currentMonth]);
  for (let month = 1; month <= 12; month += 1) {
    months.add(`${new Date().getFullYear()}-${String(month).padStart(2, "0")}`);
  }
  state.finances.forEach((item) => {
    if (/^\d{4}-\d{2}/.test(item.date || "")) months.add(item.date.slice(0, 7));
  });
  select.innerHTML = Array.from(months)
    .filter(Boolean)
    .sort((first, second) => second.localeCompare(first))
    .map((value) => `<option value="${value}">${formatFinanceMonth(value)}</option>`)
    .join("");
  select.value = state.financeMonth;
}

function formatFinanceMonth(value) {
  const names = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const [year, month] = String(value || "").split("-").map(Number);
  return names[month - 1] ? `${names[month - 1]} ${year}` : value;
}

function isInsideSelectedPeriod(dateString, filter, monthValue) {
  const date = new Date(`${dateString}T00:00:00`);
  const [year, month] = String(monthValue || "").split("-").map(Number);
  if (!year || !month || date.getFullYear() !== year || date.getMonth() !== month - 1) return false;
  if (filter === "monthly") return true;
  const currentHalf = new Date().getDate() <= 15 ? 1 : 2;
  const itemHalf = date.getDate() <= 15 ? 1 : 2;
  return currentHalf === itemHalf;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatVes(value) {
  return `Bs. ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function showStatus(message) {
  const status = document.getElementById("statusText");
  status.textContent = message;
  window.setTimeout(() => {
    status.textContent = "Datos guardados localmente en este navegador.";
  }, 2800);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
