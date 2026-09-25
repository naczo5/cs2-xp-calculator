// CS2 XP Telemetry & Average Benchmarks Logic
(function () {
  "use strict";

  const DATA = window.CS2_XP_DATA;
  if (!DATA) {
    console.error("CS2_XP_DATA not found. Make sure data.js is loaded first.");
    return;
  }

  // App State - Default to Tier 1 (Max Weekly Bonus: 4.0x)
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
    const minutesTo5k = total > 0 ? Math.round(5000 / (total / dur)) : 0;
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

  // DOM Elements
  const tierSwitchGroup = document.getElementById("tier-switch-group");
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

  // Render Global Tier Multiplier Switcher
  function renderTierSwitchers() {
    tierSwitchGroup.innerHTML = "";
    DATA.tiers.forEach(tier => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `tactile-tab ${tier.id === state.currentTierId ? "active" : ""}`;
      btn.innerHTML = `${tier.name} (${tier.multiplier}x)`;
      btn.title = tier.description;
      btn.addEventListener("click", () => {
        state.currentTierId = tier.id;
        renderTierSwitchers();
        updateBenchmarkList();
        updateCalculator();
      });
      tierSwitchGroup.appendChild(btn);
    });
  }

  // Render Master Mode Benchmark List
  function updateBenchmarkList() {
    const currentTier = getTier(state.currentTierId);
    const isWin = state.viewMode === "win";

    const rows = DATA.modes.map(mode => {
      const metric = isWin ? mode.winMetric : mode.avgMetric;
      const duration = isWin ? mode.winDuration : mode.avgDuration;
      const calc = calculateModeXp(mode, metric, duration, currentTier);
      return {
        mode,
        metric,
        duration,
        calc
      };
    });

    // Sort descending by XP per minute
    rows.sort((a, b) => b.calc.xpPerMin - a.calc.xpPerMin);

    const maxRate = rows.length > 0 ? rows[0].calc.xpPerMin : 1;

    benchmarkStack.innerHTML = "";
    rows.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = `telemetry-row-card ${index === 0 ? "rank-top" : ""}`;

      const pct = Math.min(Math.round((item.calc.xpPerMin / maxRate) * 100), 100);
      const metricUnitStr = item.mode.type === "round_based" ? "wins" : "pts";

      row.innerHTML = `
        <div class="t-rank-badge tabular-nums">#${index + 1}</div>
        <div class="t-identity">
          <span class="t-mode-title">${item.mode.name}</span>
          <span class="t-formula-spec font-mono">${item.mode.formula}</span>
        </div>
        <div class="t-stat-cell">
          <span class="t-stat-label">${isWin ? "WIN TIME" : "AVG TIME"}</span>
          <span class="t-stat-value tabular-nums">${item.duration}m</span>
        </div>
        <div class="t-stat-cell">
          <span class="t-stat-label">${isWin ? "WIN SCORE" : "AVG SCORE"}</span>
          <span class="t-stat-value tabular-nums">${item.metric} ${metricUnitStr}</span>
        </div>
        <div class="t-stat-cell">
          <span class="t-stat-label">MATCH XP</span>
          <span class="t-stat-value tabular-nums" style="color:#fff">${item.calc.total} XP</span>
        </div>
        <div class="t-throughput-cell">
          <span class="t-stat-label">THROUGHPUT</span>
          <span class="t-rate-primary tabular-nums">${item.calc.xpPerMin} <span class="t-rate-unit">XP/m</span></span>
          <span class="t-rate-hourly tabular-nums">${item.calc.xpPerHour.toLocaleString()} XP/h</span>
        </div>
        <div class="t-gauge-cell">
          <div class="tactical-gauge-track">
            <div class="tactical-gauge-fill" style="width: ${pct}%;"></div>
          </div>
          <div class="t-gauge-target tabular-nums">
            ${item.calc.total > 0 ? `5,000 XP in <strong>~${item.calc.hoursTo5k}h</strong> (${item.calc.minutesTo5k}m)` : "No XP"}
          </div>
        </div>
      `;

      row.title = "Click to load into Custom Calculator";
      row.addEventListener("click", () => {
        selectCalculatorMode(item.mode.id);
        const calcSection = document.querySelector(".tactical-cockpit-panel");
        if (calcSection) {
          calcSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });

      benchmarkStack.appendChild(row);
    });
  }

  // Calculator Mode Switcher Strip
  function renderCalcModeStrip() {
    calcModeStrip.innerHTML = "";
    DATA.modes.forEach(mode => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cockpit-mode-btn ${mode.id === state.calcModeId ? "active" : ""}`;
      btn.textContent = mode.name;
      btn.addEventListener("click", () => {
        selectCalculatorMode(mode.id);
      });
      calcModeStrip.appendChild(btn);
    });
  }

  function selectCalculatorMode(modeId) {
    state.calcModeId = modeId;
    const mode = getMode(modeId);
    state.calcMetric = mode.avgMetric;
    state.calcDuration = mode.avgDuration;

    renderCalcModeStrip();
    setupCalculatorSliders(mode);
    updateCalculator();
  }

  function setupCalculatorSliders(mode) {
    calcMetricLabel.textContent = mode.metricLabel;
    calcMetricSlider.min = mode.minMetric;
    calcMetricSlider.max = mode.maxMetric;
    calcMetricSlider.step = mode.metricStep;
    calcMetricSlider.value = state.calcMetric;

    calcDurationSlider.min = 1;
    calcDurationSlider.max = mode.id === "premier" ? 55 : (mode.id === "casual" ? 35 : 20);
    calcDurationSlider.step = 0.5;
    calcDurationSlider.value = state.calcDuration;

    calcModeNotes.textContent = `Rule: ${mode.formula} • ${mode.winCondition} • ${mode.notes}`;
  }

  function updateCalculator() {
    const currentTier = getTier(state.currentTierId);
    const mode = getMode(state.calcModeId);

    calcTierIndicator.innerHTML = `Active Tier: <strong>${currentTier.name} (${currentTier.multiplier}x)</strong>`;
    calcMetricLive.textContent = `${state.calcMetric} ${mode.unit}`;
    calcDurationLive.textContent = `${state.calcDuration} min`;

    const calc = calculateModeXp(mode, state.calcMetric, state.calcDuration, currentTier);

    readoutTotalXp.textContent = `${calc.total} XP`;
    if (currentTier.id === "tier4") {
      readoutBreakdown.textContent = `Throttled (0.175x on ${calc.base} Base XP)`;
    } else {
      readoutBreakdown.textContent = `${calc.base} Base + ${calc.bonus} Bonus`;
    }

    readoutRateMin.innerHTML = `${calc.xpPerMin} <span style="font-size:0.9rem;font-weight:600">XP/m</span>`;
    readoutRateHour.textContent = `${calc.xpPerHour.toLocaleString()} XP / hour`;

    const matches5k = calc.total > 0 ? Math.ceil(5000 / calc.total) : "—";
    const totalMins = calc.total > 0 ? Math.round(matches5k * state.calcDuration) : 0;
    const totalHours = calc.total > 0 ? +(totalMins / 60).toFixed(1) : 0;

    readoutMatchesNeeded.innerHTML = `${matches5k} <span style="font-size:0.85rem;font-weight:600">matches</span>`;
    readoutTimeNeeded.textContent = calc.total > 0 ? `~${totalHours} hours (${totalMins} min of play)` : "Zero XP earned";

    const minPer1k = calc.xpPerMin > 0 ? (1000 / calc.xpPerMin).toFixed(1) : "—";
    readoutTime1k.innerHTML = `${minPer1k} <span style="font-size:0.85rem;font-weight:600">min</span>`;
  }

  // Stepper & Slider Listeners
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

  // Average vs Win Toggle
  btnViewAvg.addEventListener("click", () => {
    state.viewMode = "avg";
    btnViewAvg.classList.add("active");
    btnViewWin.classList.remove("active");
    updateBenchmarkList();
  });

  btnViewWin.addEventListener("click", () => {
    state.viewMode = "win";
    btnViewWin.classList.add("active");
    btnViewAvg.classList.remove("active");
    updateBenchmarkList();
  });

  // Weekly Reset Countdown Telemetry
  function initWeeklyResetCountdown() {
    const timerEl = document.getElementById("reset-timer-val");
    if (!timerEl) return;

    function update() {
      const now = new Date();
      const day = now.getUTCDay();
      let daysUntilWed = (3 - day + 7) % 7;
      
      const target = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysUntilWed,
        1, 0, 0, 0
      ));

      if (day === 3 && now.getTime() >= target.getTime()) {
        target.setUTCDate(target.getUTCDate() + 7);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        timerEl.textContent = "RESETTING NOW";
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      timerEl.textContent = `IN ${d}d ${h}h ${m}m ${s}s`;
    }

    update();
    setInterval(update, 1000);
  }

  // Tactical Share Action
  function initShareButton() {
    const shareBtn = document.getElementById("btn-share-page");
    const toast = document.getElementById("tactical-toast");
    const toastMsg = document.getElementById("toast-message");
    if (!shareBtn || !toast) return;

    let toastTimeout;
    shareBtn.addEventListener("click", async () => {
      const shareUrl = window.location.href.split('#')[0];
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
        if (toastMsg) toastMsg.textContent = "URL copied to clipboard! Ready to share on Discord / Reddit";
      } catch (err) {
        if (toastMsg) toastMsg.textContent = "Share link: " + shareUrl;
      }

      toast.classList.add("visible");
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
      }, 3500);
    });
  }

  // Initialize
  renderTierSwitchers();
  updateBenchmarkList();
  renderCalcModeStrip();
  const initMode = getMode(state.calcModeId);
  setupCalculatorSliders(initMode);
  updateCalculator();
  initWeeklyResetCountdown();
  initShareButton();

})();

