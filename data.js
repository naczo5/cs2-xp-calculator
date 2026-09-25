// Counter-Strike 2 Game Mode Averages & XP Formulas
window.CS2_XP_DATA = {
  meta: {
    game: "Counter-Strike 2",
    patch: "2026.09 (Rush Hour)",
    levelRequirement: 5000,
    resetSchedule: "Wednesdays 01:00 UTC"
  },
  tiers: [
    {
      id: "tier1",
      name: "Max Weekly Bonus",
      multiplier: 4.0,
      bonusMult: 3.0,
      description: "Default weekly boost (+3x bonus on 1x base)",
      tag: "First 4,500 XP"
    },
    {
      id: "tier2",
      name: "Reduced Bonus",
      multiplier: 2.0,
      bonusMult: 1.0,
      description: "Reduced weekly boost (+1x bonus on 1x base)",
      tag: "4,500 to 7,500 XP"
    },
    {
      id: "tier3",
      name: "Standard (No Bonus)",
      multiplier: 1.0,
      bonusMult: 0.0,
      description: "Base rate after bonus pool depleted",
      tag: "7,500 to 11,166 XP"
    },
    {
      id: "tier4",
      name: "XP Overload",
      multiplier: 0.175,
      bonusMult: 0.0,
      description: "Throttled rate after 11,166 XP",
      tag: ">11,166 XP"
    }
  ],
  modes: [
    {
      id: "deathmatch",
      name: "Deathmatch",
      type: "score_based",
      formula: "Score × 0.2",
      unit: "score points",
      metricLabel: "Score Points",
      minMetric: 100,
      maxMetric: 1000,
      metricStep: 25,
      multiplier: 0.2,
      avgDuration: 10.0,
      avgMetric: 500, // Average scoreboard points across 10 min session
      winMetric: 750, // Top fragger / lobby winner
      winDuration: 10.0,
      winCondition: "10-minute server session",
      notes: "Fixed 10-minute timer. Pure mechanical aim farming. Subject to anti-bot cap (~150-200 base XP max)."
    },
    {
      id: "premier",
      name: "Premier / Competitive",
      type: "round_based",
      formula: "Rounds Won × 30",
      unit: "rounds won",
      metricLabel: "Rounds Won",
      minMetric: 0,
      maxMetric: 16,
      metricStep: 0.5,
      multiplier: 30,
      avgDuration: 34.0, // Average regulation match (approx 21-22 total rounds played)
      avgMetric: 10.5,   // Average rounds won at 50% winrate
      winMetric: 13,     // Standard regulation win (MR12)
      winDuration: 32.0,
      winCondition: "First to 13 rounds (MR12) or 16 in OT",
      notes: "Highest XP payout per single match, but longest time commitment."
    },
    {
      id: "wingman",
      name: "Wingman (2v2)",
      type: "round_based",
      formula: "Rounds Won × 15",
      unit: "rounds won",
      metricLabel: "Rounds Won",
      minMetric: 0,
      maxMetric: 9,
      metricStep: 0.5,
      multiplier: 15,
      avgDuration: 12.0,
      avgMetric: 7.0,    // Average rounds won at 50% winrate
      winMetric: 9,      // Standard win (MR8)
      winDuration: 11.5,
      winCondition: "First to 9 rounds (MR8)",
      notes: "Consistent duo rate. Zero downtime between rounds."
    },
    {
      id: "rush",
      name: "Rush (3v3)",
      type: "round_based",
      formula: "Rounds Won × 10",
      unit: "rounds won",
      metricLabel: "Rounds Won",
      minMetric: 0,
      maxMetric: 8,
      metricStep: 0.5,
      multiplier: 10,
      avgDuration: 7.5,  // Verified across short blowouts (5m) and full games (10m)
      avgMetric: 5.5,    // Average rounds won at 50% winrate
      winMetric: 6.0,    // Fast 4-round lead castle capture (6-2 in ~5.2 min)
      winDuration: 5.22,
      winCondition: "4-round lead (Castle capture) OR first to 8 wins",
      notes: "Fastest round-based burst. Instant win on 4-round lead (e.g. 6-2 in 5m 13s)."
    },
    {
      id: "casual",
      name: "Casual (10v10)",
      type: "score_based",
      formula: "Score × 4.0",
      unit: "score points",
      metricLabel: "Score Points",
      minMetric: 5,
      maxMetric: 100,
      metricStep: 5,
      multiplier: 4.0,
      avgDuration: 22.0,
      avgMetric: 35,     // Average player score (12-14 kills + assists/plants)
      winMetric: 60,     // Top fragger score
      winDuration: 20.0,
      winCondition: "First to 8 rounds (MR15 max)",
      notes: "High 4x score multiplier, but spectator downtime if eliminated early."
    },
    {
      id: "retakes",
      name: "Retakes",
      type: "score_based",
      formula: "Score × 2.0",
      unit: "score points",
      metricLabel: "Score Points",
      minMetric: 5,
      maxMetric: 60,
      metricStep: 5,
      multiplier: 2.0,
      avgDuration: 10.0,
      avgMetric: 30,     // Average scoreboard points
      winMetric: 45,     // High-impact clutch performance
      winDuration: 10.0,
      winCondition: "First to 8 rounds",
      notes: "Rapid 4v3 post-plant scenarios."
    },
    {
      id: "arms_race",
      name: "Arms Race",
      type: "score_based",
      formula: "Score × 1.0",
      unit: "weapon score",
      metricLabel: "Weapon Score",
      minMetric: 10,
      maxMetric: 80,
      metricStep: 5,
      multiplier: 1.0,
      avgDuration: 8.5,
      avgMetric: 50,     // Average finish weapon level (weapon 10-12)
      winMetric: 80,     // Match winner (Golden Knife)
      winDuration: 7.5,
      winCondition: "First to Golden Knife kill",
      notes: "Continuous action with instant respawns. Clean 1:1 score to base XP."
    }
  ],
  verifiedMatches: [
    {
      id: "proof-1",
      mode: "Rush Complex",
      score: "8 - 7",
      result: "Win (First to 8)",
      time: "10:51 (10.85m)",
      roundsWon: 8,
      baseXp: 80,
      maxBonusXp: 320,
      baseXpMin: 7.37,
      maxXpMin: 29.49
    },
    {
      id: "proof-2",
      mode: "Rush Complex",
      score: "8 - 4",
      result: "Win (8 Wins + 4 Lead)",
      time: "9:17 (9.28m)",
      roundsWon: 8,
      baseXp: 80,
      maxBonusXp: 320,
      baseXpMin: 8.62,
      maxXpMin: 34.48
    },
    {
      id: "proof-3",
      mode: "Rush Complex",
      score: "6 - 2",
      result: "Win (Instant 4 Lead)",
      time: "5:13 (5.22m)",
      roundsWon: 6,
      baseXp: 60,
      maxBonusXp: 240,
      baseXpMin: 11.50,
      maxXpMin: 45.98
    }
  ]
};
