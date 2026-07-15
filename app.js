const storageKeys = {
  patients: "dentalSpaPatients",
  finances: "dentalSpaFinances",
  percentages: "dentalSpaPercentages",
};

const state = {
  patients: load(storageKeys.patients, []),
  finances: load(storageKeys.finances, []),
  percentages: load(storageKeys.percentages, []),
  odontogramMarks: {},
  selectedColor: "red",
  financeFilter: "biweekly",
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
  balance: "Balance Financiero",
  porcentajes: "Porcentajes",
};

document.addEventListener("DOMContentLoaded", () => {
  setTodayDefaults();
  bindNavigation();
  bindPatientForm();
  bindOdontogramTools();
  bindHistory();
  bindFinance();
  bindPercentages();
  addTreatmentRow();
  renderOdontogram();
  renderPatientResults();
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
  const today = new Date().toISOString().slice(0, 10);
  document.querySelector('input[name="date"]').value = today;
  document.querySelector('#financeForm input[name="date"]').value = today;
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
  document.querySelectorAll(".color-option").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".color-option").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
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
    </svg>
    <span class="tooth-number">${toothId}</span>
  `;
  wrapper.querySelectorAll(".tooth-face").forEach((face) => {
    face.addEventListener("click", () => paintToothFace(toothId, face.dataset.face));
    face.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        paintToothFace(toothId, face.dataset.face);
      }
    });
  });
  return wrapper;
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
  const treatmentPlan = renderTreatmentPlan(patient.treatments);

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

function renderTreatmentPlan(treatments = []) {
  const items = Array.isArray(treatments) ? treatments : [];
  const total = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  if (!items.length) {
    return '<div class="empty-state compact-visible">Sin plan de tratamiento registrado.</div>';
  }

  const rows = items.map((item) => `
    <div class="treatment-summary-row">
      <span>${escapeHtml(item.name || "Tratamiento")}</span>
      <strong>${formatUsd(Number(item.cost || 0))}</strong>
      <strong>${formatVes(0)}</strong>
    </div>
  `).join("");

  return `
    <div class="treatment-summary">
      ${rows}
      <div class="treatment-summary-row total">
        <span>Total</span>
        <strong>${formatUsd(total)}</strong>
        <strong>${formatVes(0)}</strong>
      </div>
    </div>
  `;
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
      return `${tooth} ${faceLabels[face] || face}: ${color === "red" ? "Rojo" : "Azul"}`;
    });
  });
  return marks.length ? marks.join(", ") : "Sin marcas";
}

function bindPercentages() {
  const form = document.getElementById("percentageForm");
  document.getElementById("generatePercentages").addEventListener("click", () => renderPercentageRows());
  document.getElementById("addDentistLine").addEventListener("click", addDentistLine);
  form.elements.dentistCount.addEventListener("change", () => renderPercentageRows());
  form.elements.exchangeRate.addEventListener("input", updatePercentageTotals);
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
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePercentageReport();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rows = getPercentageRows();
    const income = rows.reduce((sum, row) => sum + row.amount, 0);

    if (!income) {
      setPercentageMessage("Ingresa al menos un monto para guardar el reparto.", true);
      return;
    }

    state.percentages.unshift({
      id: crypto.randomUUID(),
      date: form.elements.date.value,
      income,
      exchangeRate: getExchangeRate(),
      incomeVes: rows.reduce((sum, row) => sum + row.amountVes, 0),
      rows,
    });
    save(storageKeys.percentages, state.percentages);
    renderSavedPercentages();
    clearPercentageInputs();
    setPercentageMessage("Reparto guardado correctamente.");
  });
}

function renderPercentageRows() {
  const form = document.getElementById("percentageForm");
  const count = Math.max(0, Math.min(20, Number(form.elements.dentistCount.value || 0)));
  const body = document.getElementById("percentageRows");
  const previous = getPercentageRows();
  body.innerHTML = "";

  createPercentageRow(body, previous[0] || { name: "Clinica", amount: 0 }, true);
  for (let index = 0; index < count; index += 1) {
    createPercentageRow(body, previous[index + 1] || { name: `Odontologa ${index + 1}`, amount: 0 });
  }
  updatePercentageTotals();
}

function createPercentageRow(body, row, clinic = false) {
  const element = document.createElement("tr");
  element.dataset.clinic = clinic ? "true" : "false";
  element.innerHTML = `
    <td><input class="percentage-name" value="${escapeHtml(row.name)}" ${clinic ? "aria-label=\"Clinica\"" : "aria-label=\"Odontologa\""} /></td>
    <td><input class="percentage-amount-input" type="number" min="0" step="any" inputmode="decimal" value="${row.amount ? Number(row.amount) : ""}" aria-label="Ingreso USD" /></td>
    <td><input class="percentage-ves-input" type="number" min="0" step="any" inputmode="decimal" value="" aria-label="Ingreso VES" /></td>
    <td class="percentage-value">0.00%</td>
    <td class="percentage-row-actions">${clinic ? "" : '<button type="button" class="remove-dentist-button">Quitar</button>'}</td>
  `;
  element.querySelector(".percentage-amount-input").addEventListener("input", () => {
    syncVesFromUsd(element);
    updatePercentageTotals();
  });
  element.querySelector(".percentage-ves-input").addEventListener("change", () => {
    if (syncUsdFromVes(element)) {
      updatePercentageTotals();
    }
  });
  element.querySelector(".percentage-name").addEventListener("input", updatePercentageTotals);
  if (!clinic) {
    element.querySelector(".remove-dentist-button").addEventListener("click", () => {
      element.remove();
      updateDentistCount();
      updatePercentageTotals();
    });
  }
  body.appendChild(element);
}

function addDentistLine() {
  const body = document.getElementById("percentageRows");
  const count = body.querySelectorAll('tr[data-clinic="false"]').length + 1;
  createPercentageRow(body, { name: `Odontologa ${count}`, amount: 0 });
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
  form.elements.dentistCount.value = 1;
  const body = document.getElementById("percentageRows");
  body.innerHTML = "";
  createPercentageRow(body, { name: "Clinica", amount: 0 }, true);
  createPercentageRow(body, { name: "", amount: 0 });
  updatePercentageTotals();
}

function getPercentageRows() {
  const exchangeRate = getExchangeRate();
  const rows = Array.from(document.querySelectorAll("#percentageRows tr")).map((row) => ({
    name: row.querySelector(".percentage-name").value.trim() || "Sin nombre",
    amount: Number(row.querySelector(".percentage-amount-input").value || 0),
  }));
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows.map((row) => ({
    ...row,
    amountVes: row.amount * exchangeRate,
    percentage: total ? row.amount / total * 100 : 0,
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

function syncUsdFromVes(row) {
  const exchangeRate = getExchangeRate();
  if (!exchangeRate) {
    setPercentageMessage("Indica una tasa de cambio para convertir el ingreso VES a USD.", true);
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
  const clinic = rows[0] || { amount: 0, amountVes: 0 };
  const dentistRows = rows.slice(1);
  const amountTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const amountVesTotal = rows.reduce((sum, row) => sum + row.amountVes, 0);
  const totalPercentage = amountTotal ? 100 : 0;

  document.querySelectorAll("#percentageRows tr").forEach((row, index) => {
    const percentage = amountTotal ? rows[index].amount / amountTotal * 100 : 0;
    rows[index].percentage = percentage;
    const usdInput = row.querySelector(".percentage-amount-input");
    if (usdInput.value) {
      row.querySelector(".percentage-ves-input").value = rows[index].amountVes.toFixed(2);
    }
    row.querySelector(".percentage-value").textContent = `${percentage.toFixed(2)}%`;
  });
  document.getElementById("percentageClinicUsd").textContent = formatUsd(clinic.amount);
  document.getElementById("percentageClinicVes").textContent = formatVes(clinic.amountVes);
  document.getElementById("percentageClinicPercent").textContent = `${(amountTotal ? clinic.amount / amountTotal * 100 : 0).toFixed(2)}%`;
  renderDentistTotals(dentistRows, amountTotal);
  document.getElementById("percentageTotal").textContent = `${totalPercentage.toFixed(2)}%`;
  document.getElementById("percentageAmountTotal").textContent = formatUsd(amountTotal);
  document.getElementById("percentageVesTotal").textContent = formatVes(amountVesTotal);
  setPercentageMessage(amountTotal ? "Puedes ingresar USD o VES; el otro monto se calcula con la tasa de cambio." : "Ingresa los montos de cada beneficiario. El total se calcula abajo.");
}

function renderDentistTotals(dentistRows, amountTotal) {
  const grandTotal = document.getElementById("percentageGrandTotal");
  const footer = grandTotal.parentElement;
  footer.querySelectorAll("tr[data-dentist-total]").forEach((row) => row.remove());

  dentistRows.forEach((dentist, index) => {
    const row = document.createElement("tr");
    row.dataset.dentistTotal = "true";
    const name = dentist.name === "Sin nombre" ? `Odontologa ${index + 1}` : dentist.name;
    const percentage = amountTotal ? dentist.amount / amountTotal * 100 : 0;
    row.innerHTML = `
      <th>Total ${escapeHtml(name)}</th>
      <th>${formatUsd(dentist.amount)}</th>
      <th>${formatVes(dentist.amountVes)}</th>
      <th>${percentage.toFixed(2)}%</th>
      <th></th>
    `;
    footer.insertBefore(row, grandTotal);
  });
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
  }));
  const totalUsd = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalVes = rows.reduce((sum, row) => sum + row.amountVes, 0);
  const clinic = rows[0] || { name: "Clinica", amount: 0, amountVes: 0 };
  const dentists = rows.slice(1);

  document.getElementById("percentageReportTitle").textContent = "Detalle del reparto";
  document.getElementById("percentageReportSubtitle").textContent = `Fecha: ${entry.date}${exchangeRate ? ` - Tasa: ${formatVes(exchangeRate)} por USD` : ""}`;
  document.getElementById("percentageReportContent").innerHTML = `
    <div class="report-table-wrap">
      <table class="report-table">
        <thead>
          <tr><th>Beneficiario</th><th>Ingreso USD</th><th>Ingreso VES</th><th>Porcentaje</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${formatUsd(row.amount)}</td><td>${formatVes(row.amountVes)}</td><td>${(totalUsd ? row.amount / totalUsd * 100 : 0).toFixed(2)}%</td></tr>`).join("")}
        </tbody>
        <tfoot>
          <tr><th>Total clinica</th><th>${formatUsd(clinic.amount)}</th><th>${formatVes(clinic.amountVes)}</th><th>${(totalUsd ? clinic.amount / totalUsd * 100 : 0).toFixed(2)}%</th></tr>
          ${dentists.map((dentist, index) => `<tr><th>Total ${escapeHtml(dentist.name === "Sin nombre" ? `Odontologa ${index + 1}` : dentist.name)}</th><th>${formatUsd(dentist.amount)}</th><th>${formatVes(dentist.amountVes)}</th><th>${(totalUsd ? dentist.amount / totalUsd * 100 : 0).toFixed(2)}%</th></tr>`).join("")}
          <tr class="report-grand-total"><th>Total general</th><th>${formatUsd(totalUsd)}</th><th>${formatVes(totalVes)}</th><th>${totalUsd ? "100.00%" : "0.00%"}</th></tr>
        </tfoot>
      </table>
    </div>
  `;
  document.getElementById("percentageReportModal").hidden = false;
}

function openMonthlyPercentageReport(monthKey) {
  const entries = state.percentages.filter((entry) => String(entry.date || "").startsWith(monthKey));
  if (!entries.length) return;

  const clinic = { name: "Clinica", amount: 0, amountVes: 0 };
  const dentists = new Map();
  entries.forEach((entry) => {
    const exchangeRate = Number(entry.exchangeRate || 0);
    const rows = entry.rows.map((row) => ({
      name: row.name || "Sin nombre",
      amount: Number(row.amount || 0),
      amountVes: Number(row.amountVes ?? Number(row.amount || 0) * exchangeRate),
    }));
    if (rows[0]) {
      clinic.amount += rows[0].amount;
      clinic.amountVes += rows[0].amountVes;
    }
    rows.slice(1).forEach((dentist, index) => {
      const name = dentist.name === "Sin nombre" ? `Odontologa ${index + 1}` : dentist.name;
      const total = dentists.get(name) || { name, amount: 0, amountVes: 0 };
      total.amount += dentist.amount;
      total.amountVes += dentist.amountVes;
      dentists.set(name, total);
    });
  });

  const rows = [clinic, ...dentists.values()];
  const totalUsd = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalVes = rows.reduce((sum, row) => sum + row.amountVes, 0);
  const metadata = getMonthMetadata(monthKey);
  document.getElementById("percentageReportTitle").textContent = "Reporte general mensual";
  document.getElementById("percentageReportSubtitle").textContent = `Periodo: ${metadata.range} - ${entries.length} repartos`;
  document.getElementById("percentageReportContent").innerHTML = `
    <div class="report-table-wrap">
      <table class="report-table">
        <thead>
          <tr><th>Beneficiario</th><th>Total USD</th><th>Total VES</th><th>Porcentaje</th></tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${formatUsd(row.amount)}</td><td>${formatVes(row.amountVes)}</td><td>${(totalUsd ? row.amount / totalUsd * 100 : 0).toFixed(2)}%</td></tr>`).join("")}
        </tbody>
        <tfoot>
          <tr><th>Total clinica</th><th>${formatUsd(clinic.amount)}</th><th>${formatVes(clinic.amountVes)}</th><th>${(totalUsd ? clinic.amount / totalUsd * 100 : 0).toFixed(2)}%</th></tr>
          ${Array.from(dentists.values()).map((dentist) => `<tr><th>Total ${escapeHtml(dentist.name)}</th><th>${formatUsd(dentist.amount)}</th><th>${formatVes(dentist.amountVes)}</th><th>${(totalUsd ? dentist.amount / totalUsd * 100 : 0).toFixed(2)}%</th></tr>`).join("")}
          <tr class="report-grand-total"><th>Total general del mes</th><th>${formatUsd(totalUsd)}</th><th>${formatVes(totalVes)}</th><th>${totalUsd ? "100.00%" : "0.00%"}</th></tr>
        </tfoot>
      </table>
    </div>
  `;
  document.getElementById("percentageReportModal").hidden = false;
}

function closePercentageReport() {
  document.getElementById("percentageReportModal").hidden = true;
}

function bindFinance() {
  renderFinanceCategories();
  document.querySelector('#financeForm select[name="type"]').addEventListener("change", renderFinanceCategories);

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
  select.innerHTML = '<option value="">Sin asociar</option>';
  state.patients.forEach((patient) => {
    const option = document.createElement("option");
    option.value = patient.id;
    option.textContent = `${patient.name} - ${patient.idNumber || "Sin cedula"}`;
    select.appendChild(option);
  });
}

function renderFinance() {
  const filtered = state.finances.filter((item) => isInsideCurrentPeriod(item.date, state.financeFilter));
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

function isInsideCurrentPeriod(dateString, filter) {
  const date = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) return false;
  if (filter === "monthly") return true;
  const currentHalf = now.getDate() <= 15 ? 1 : 2;
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
