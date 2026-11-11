// CS2 XP Calculator & Mode Benchmarks
(function () {
  "use strict";

  const DATA = window.CS2_XP_DATA;
  if (!DATA) {
    console.error("CS2_XP_DATA not found. Make sure data.js is loaded first.");
    return;
  }

  const LEVEL_XP = 5000;
  const number = new Intl.NumberFormat("en-US");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // App state — default to the full weekly bonus (4×)
  const state = {
    currentTierId: "tier1",
    viewMode: "avg", // "avg" or "win"
    calcModeId: "rush",
    calcMetric: 5.5,
    calcDuration: 7.5
  };

  function getTier(tierId) {
    return DATA.tiers.find(t => t.id === tierId) || DATA.tiers[0];
  }

  function getMode(modeId) {
    return DATA.modes.find(m => m.id === modeId) || DATA.modes[0];
  }

  function calculateModeXp(mode, metric, duration, tier) {
    const base = Math.floor(metric * mode.multiplier);
    let total = 0;
    let bonus = 0;

    if (tier.id === "tier4") {
      total = Math.floor(base * 0.175);
      bonus = 0;
    } else {
      bonus = Math.floor(base * tier.bonusMult);
      total = base + bonus;
    }

    const dur = Math.max(duration, 0.1);
    const xpPerMin = +(total / dur).toFixed(2);
    const xpPerHour = +((total / dur) * 60).toFixed(1);
    const minutesTo5k = total > 0 ? Math.round(LEVEL_XP / (total / dur)) : 0;
    const hoursTo5k = total > 0 ? +(minutesTo5k / 60).toFixed(1) : 0;

    return {
      base,
      bonus,
      total,
      duration: dur,
      xpPerMin,
      xpPerHour,
      minutesTo5k,
      hoursTo5k
    };
  }

  function formatHours(hours) {
    if (hours >= 10) return `${Math.round(hours)} h`;
    return `${hours.toFixed(1)} h`;
  }

  function formatRate(rate) {
    return rate.toFixed(1);
  }

  function durationLabel(minutes) {
    return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
  }

  function updateSliderFill(el) {
    const min = parseFloat(el.min) || 0;
    const max = parseFloat(el.max) || 100;
    const value = parseFloat(el.value) || 0;
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    el.style.setProperty("--fill", `${pct}%`);
  }

  // DOM elements
  const tierSwitchGroup = document.getElementById("tier-switch-group");
  const tierBarNote = document.getElementById("tier-bar-note");
  const heroAnswerMode = document.getElementById("hero-answer-mode");
  const heroAnswerRate = document.getElementById("hero-answer-rate");
  const heroAnswerView = document.getElementById("hero-answer-view");
  const heroAnswerNote = document.getElementById("hero-answer-note");

  const btnViewAvg = document.getElementById("btn-view-avg");
  const btnViewWin = document.getElementById("btn-view-win");
  const benchmarkStack = document.getElementById("benchmark-stack");

  const calcModeStrip = document.getElementById("calc-mode-strip");
  const calcTierIndicator = document.getElementById("calc-tier-indicator");
  const calcMetricLabel = document.getElementById("calc-metric-label");
  const calcMetricLive = document.getElementById("calc-metric-live");
  const calcMetricSlider = document.getElementById("calc-metric-slider");
  const btnMetricDec = document.getElementById("btn-metric-dec");
  const btnMetricInc = document.getElementById("btn-metric-inc");

  const calcDurationLive = document.getElementById("calc-duration-live");
  const calcDurationSlider = document.getElementById("calc-duration-slider");
  const btnDurDec = document.getElementById("btn-dur-dec");
  const btnDurInc = document.getElementById("btn-dur-inc");
  const calcModeNotes = document.getElementById("calc-mode-notes");

  const readoutTotalXp = document.getElementById("readout-total-xp");
  const readoutBreakdown = document.getElementById("readout-breakdown");
  const readoutRateMin = document.getElementById("readout-rate-min");
  const readoutRateHour = document.getElementById("readout-rate-hour");
  const readoutMatchesNeeded = document.getElementById("readout-matches-needed");
  const readoutTimeNeeded = document.getElementById("readout-time-needed");
  const readoutTime1k = document.getElementById("readout-time-1k");
  const readoutDropFill = document.getElementById("readout-drop-fill");
  const readoutDropCaption = document.getElementById("readout-drop-caption");

  function renderTierSwitchers() {
    tierSwitchGroup.innerHTML = "";

    DATA.tiers.forEach(tier => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tier-tab";
      btn.dataset.tierId = tier.id;
      btn.title = `${tier.description} ${tier.tag}.`;
      btn.setAttribute("aria-pressed", String(tier.id === state.currentTierId));
      btn.innerHTML = `
        <span class="tier-tab-name">${tier.name}</span>
        <span class="tier-tab-mult">${tier.multiplier}×</span>
      `;

      if (tier.id === state.currentTierId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        if (state.currentTierId === tier.id) return;
        state.currentTierId = tier.id;
        setTierButtons();
        updateAll();
      });

      tierSwitchGroup.appendChild(btn);
    });
  }

  function setTierButtons() {
    tierSwitchGroup.querySelectorAll(".tier-tab").forEach(btn => {
      const active = btn.dataset.tierId === state.currentTierId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function buildRows(tier, isWin) {
    const rows = DATA.modes.map(mode => {
      const metric = isWin ? mode.winMetric : mode.avgMetric;
      const duration = isWin ? mode.winDuration : mode.avgDuration;

      return {
        mode,
        metric,
        duration,
        calc: calculateModeXp(mode, metric, duration, tier)
      };
    });

    rows.sort((a, b) => b.calc.xpPerMin - a.calc.xpPerMin);
    return rows;
  }

  function updateHero(rows, tier) {
    const top = rows[0];
    if (!top) return;

    const isWin = state.viewMode === "win";
    heroAnswerMode.textContent = top.mode.name;
    heroAnswerRate.textContent = `${formatRate(top.calc.xpPerMin)} XP/min`;
    heroAnswerView.textContent = isWin ? "a winning match" : "a typical match";
    heroAnswerNote.textContent = `${tier.tag} at the ${tier.multiplier}× weekly bonus.`;
  }

  function renderRankRows(rows) {
    const isWin = state.viewMode === "win";
    const maxRate = rows.length > 0 ? rows[0].calc.xpPerMin : 1;
    benchmarkStack.innerHTML = "";

    rows.forEach((item, index) => {
      const pct = maxRate > 0 ? Math.min(Math.round((item.calc.xpPerMin / maxRate) * 100), 100) : 0;
      const isTop = index === 0;

      const row = document.createElement("button");
      row.type = "button";
      row.className = `rank-row${isTop ? " rank-row-top" : ""}`;
      row.style.setProperty("--i", String(index));
      row.innerHTML = `
        <span class="rank-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="rank-main">
          <span class="rank-title-row">
            <span class="rank-name">${item.mode.name}</span>
            <span class="rank-formula">
              <span class="cat-dot ${item.mode.type === "round_based" ? "is-round" : "is-score"}" aria-hidden="true"></span>
              ${item.mode.formula}
            </span>
          </span>
          <span class="rank-bar" aria-hidden="true">
            <span class="rank-bar-fill" style="--pct:${(pct / 100).toFixed(3)}"></span>
          </span>
          <span class="rank-meta">
            <span>${isWin ? "Win" : "Typical"} ${durationLabel(item.duration)} min</span>
            <span>${number.format(item.calc.total)} XP</span>
            <span>5,000 XP in ~${formatHours(item.calc.hoursTo5k)}</span>
          </span>
        </span>
        <span class="rank-rate">${formatRate(item.calc.xpPerMin)}<span class="rank-rate-unit">XP/min</span></span>
        <span class="sr-only">Load into the calculator.</span>
      `;

      row.title = `Load ${item.mode.name} into the calculator`;
      row.addEventListener("click", () => {
        selectCalculatorMode(item.mode.id);
        const calcSection = document.getElementById("calculator");
        if (calcSection) {
          calcSection.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "start"
          });
        }
      });

      benchmarkStack.appendChild(row);
    });
  }

  function renderCalcModeStrip() {
    calcModeStrip.innerHTML = "";

    DATA.modes.forEach(mode => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mode-btn";
      btn.dataset.modeId = mode.id;
      btn.textContent = mode.name;
      btn.setAttribute("aria-pressed", String(mode.id === state.calcModeId));
      if (mode.id === state.calcModeId) btn.classList.add("active");

      btn.addEventListener("click", () => {
        selectCalculatorMode(mode.id);
      });

      calcModeStrip.appendChild(btn);
    });
  }

  function setActiveModeButton(modeId) {
    calcModeStrip.querySelectorAll(".mode-btn").forEach(btn => {
      const active = btn.dataset.modeId === modeId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function selectCalculatorMode(modeId) {
    state.calcModeId = modeId;
    const mode = getMode(modeId);
    state.calcMetric = mode.avgMetric;
    state.calcDuration = mode.avgDuration;

    setActiveModeButton(modeId);
    setupCalculatorSliders(mode);
    updateCalculator();
  }

  function setupCalculatorSliders(mode) {
    calcMetricLabel.textContent = mode.metricLabel;
    btnMetricDec.setAttribute("aria-label", `Decrease ${mode.metricLabel.toLowerCase()}`);
    btnMetricInc.setAttribute("aria-label", `Increase ${mode.metricLabel.toLowerCase()}`);
    calcMetricSlider.min = mode.minMetric;
    calcMetricSlider.max = mode.maxMetric;
    calcMetricSlider.step = mode.metricStep;
    calcMetricSlider.value = state.calcMetric;

    calcDurationSlider.min = 1;
    calcDurationSlider.max = mode.id === "premier" ? 55 : (mode.id === "casual" ? 35 : 20);
    calcDurationSlider.step = 0.5;
    calcDurationSlider.value = state.calcDuration;

    calcModeNotes.textContent = `${mode.formula}. ${mode.winCondition}. ${mode.notes}`;

    updateSliderFill(calcMetricSlider);
    updateSliderFill(calcDurationSlider);
  }

  function updateCalculator() {
    const tier = getTier(state.currentTierId);
    const mode = getMode(state.calcModeId);
    const isReduced = tier.id === "tier4";

    calcTierIndicator.innerHTML = `<span class="console-tier-label">Tier</span> <strong>${tier.name} · ${tier.multiplier}×</strong>`;
    calcMetricLive.textContent = `${state.calcMetric} ${mode.unit}`;
    calcDurationLive.textContent = `${state.calcDuration} min`;

    const calc = calculateModeXp(mode, state.calcMetric, state.calcDuration, tier);

    readoutTotalXp.textContent = number.format(calc.total);
    readoutBreakdown.textContent = isReduced
      ? `${calc.base} base × 0.175 reduced`
      : `${calc.base} base + ${calc.bonus} bonus`;

    readoutRateMin.textContent = formatRate(calc.xpPerMin);
    readoutRateHour.textContent = `${number.format(Math.round(calc.xpPerHour))} XP per hour`;

    const matches5k = calc.total > 0 ? Math.ceil(LEVEL_XP / calc.total) : null;
    const totalMins = matches5k ? Math.round(matches5k * state.calcDuration) : 0;
    const totalHours = totalMins > 0 ? +(totalMins / 60).toFixed(1) : 0;

    readoutMatchesNeeded.textContent = matches5k ? number.format(matches5k) : "—";
    readoutTimeNeeded.textContent = matches5k
      ? `~${formatHours(totalHours)} of play`
      : "No XP at this score";

    const minPer1k = calc.xpPerMin > 0 ? (1000 / calc.xpPerMin).toFixed(1) : null;
    readoutTime1k.textContent = minPer1k || "—";

    const dropPct = Math.min((calc.total / LEVEL_XP) * 100, 100);
    readoutDropFill.style.width = `${dropPct}%`;
    readoutDropCaption.textContent = calc.total >= LEVEL_XP
      ? "Covers the full 5,000 XP weekly drop"
      : `${Math.round(dropPct)}% of the 5,000 XP weekly drop`;

    updateSliderFill(calcMetricSlider);
    updateSliderFill(calcDurationSlider);
  }

  function updateAll() {
    const tier = getTier(state.currentTierId);
    const isWin = state.viewMode === "win";
    const rows = buildRows(tier, isWin);

    updateHero(rows, tier);
    renderRankRows(rows);
    updateCalculator();

    tierBarNote.textContent = tier.description;
  }

  // Stepper and slider listeners
  btnMetricDec.addEventListener("click", () => {
    const mode = getMode(state.calcModeId);
    state.calcMetric = Math.max(mode.minMetric, +(state.calcMetric - mode.metricStep).toFixed(1));
    calcMetricSlider.value = state.calcMetric;
    updateCalculator();
  });

  btnMetricInc.addEventListener("click", () => {
    const mode = getMode(state.calcModeId);
    state.calcMetric = Math.min(mode.maxMetric, +(state.calcMetric + mode.metricStep).toFixed(1));
    calcMetricSlider.value = state.calcMetric;
    updateCalculator();
  });

  calcMetricSlider.addEventListener("input", (e) => {
    state.calcMetric = parseFloat(e.target.value);
    updateCalculator();
  });

  btnDurDec.addEventListener("click", () => {
    const minDur = parseFloat(calcDurationSlider.min) || 1;
    state.calcDuration = Math.max(minDur, +(state.calcDuration - 0.5).toFixed(1));
    calcDurationSlider.value = state.calcDuration;
    updateCalculator();
  });

  btnDurInc.addEventListener("click", () => {
    const maxDur = parseFloat(calcDurationSlider.max) || 55;
    state.calcDuration = Math.min(maxDur, +(state.calcDuration + 0.5).toFixed(1));
    calcDurationSlider.value = state.calcDuration;
    updateCalculator();
  });

  calcDurationSlider.addEventListener("input", (e) => {
    state.calcDuration = parseFloat(e.target.value);
    updateCalculator();
  });

  // Typical vs winning match
  btnViewAvg.addEventListener("click", () => {
    if (state.viewMode === "avg") return;
    state.viewMode = "avg";
    btnViewAvg.classList.add("active");
    btnViewAvg.setAttribute("aria-pressed", "true");
    btnViewWin.classList.remove("active");
    btnViewWin.setAttribute("aria-pressed", "false");
    updateAll();
  });

  btnViewWin.addEventListener("click", () => {
    if (state.viewMode === "win") return;
    state.viewMode = "win";
    btnViewWin.classList.add("active");
    btnViewWin.setAttribute("aria-pressed", "true");
    btnViewAvg.classList.remove("active");
    btnViewAvg.setAttribute("aria-pressed", "false");
    updateAll();
  });

  // Weekly reset countdown and local/UTC popup
  function initWeeklyResetCountdown() {
    const timerEl = document.getElementById("reset-timer-val");
    const wrapEl = document.getElementById("reset-status");
    const triggerEl = document.getElementById("reset-trigger");
    const popupEl = document.getElementById("reset-popup");
    const popupCountdown = document.getElementById("popup-reset-countdown");
    const popupLocalTime = document.getElementById("popup-local-time");
    const popupLocalTz = document.getElementById("popup-local-tz");
    const popupUtcTime = document.getElementById("popup-utc-time");

    if (!timerEl || !wrapEl || !triggerEl) return;

    let userTz = "";
    try {
      userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {}

    function setOpen(open) {
      wrapEl.classList.toggle("is-open", open);
      triggerEl.setAttribute("aria-expanded", String(open));
      if (popupEl) popupEl.setAttribute("aria-hidden", String(!open));
    }

    function getNextResetDate() {
      const now = new Date();
      const day = now.getUTCDay();
      const daysUntilWed = (3 - day + 7) % 7;

      const target = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysUntilWed,
        1, 0, 0, 0
      ));

      if (day === 3 && now.getTime() >= target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 7);
      }
      return { now, target };
    }

    function update() {
      const { now, target } = getNextResetDate();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        timerEl.textContent = "now";
        if (popupCountdown) popupCountdown.textContent = "Resetting now";
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      timerEl.textContent = `${d}d ${h}h ${m}m ${s}s`;
      if (popupCountdown) popupCountdown.textContent = `${d}d ${h}h ${m}m ${s}s`;

      if (popupLocalTime) {
        try {
          popupLocalTime.textContent = target.toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short"
          });
        } catch (e) {
          popupLocalTime.textContent = target.toLocaleString();
        }
      }

      if (popupLocalTz) {
        try {
          const offsetMin = -target.getTimezoneOffset();
          const offsetHours = Math.floor(Math.abs(offsetMin) / 60);
          const offsetMinsRemainder = Math.abs(offsetMin) % 60;
          const offsetSign = offsetMin >= 0 ? "+" : "-";
          const offsetStr = `UTC${offsetSign}${offsetHours}${offsetMinsRemainder > 0 ? `:${offsetMinsRemainder}` : ""}`;
          popupLocalTz.textContent = userTz ? `${userTz} (${offsetStr})` : offsetStr;
        } catch (e) {
          popupLocalTz.textContent = userTz || "Local";
        }
      }

      if (popupUtcTime) {
        try {
          const utcStr = target.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC"
          }) + " UTC";
          popupUtcTime.textContent = utcStr;
        } catch (e) {
          popupUtcTime.textContent = "Wed, 01:00 UTC";
        }
      }
    }

    triggerEl.addEventListener("click", () => {
      setOpen(!wrapEl.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
      if (!wrapEl.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    update();
    setInterval(update, 1000);
  }

  // Share link
  function initShareButton() {
    const shareBtn = document.getElementById("btn-share-page");
    const toast = document.getElementById("tactical-toast");
    const toastMsg = document.getElementById("toast-message");
    if (!shareBtn || !toast) return;

    let toastTimeout;
    shareBtn.addEventListener("click", async () => {
      const shareUrl = window.location.href.split("#")[0];
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const input = document.createElement("input");
          input.value = shareUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          document.body.removeChild(input);
        }
        if (toastMsg) toastMsg.textContent = "Link copied to clipboard";
      } catch (err) {
        if (toastMsg) toastMsg.textContent = shareUrl;
      }

      toast.classList.add("visible");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
      }, 3000);
    });
  }

  // Initialize
  renderTierSwitchers();
  renderCalcModeStrip();
  const initMode = getMode(state.calcModeId);
  setupCalculatorSliders(initMode);
  updateAll();
  initWeeklyResetCountdown();
  initShareButton();
})();
