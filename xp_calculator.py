"""CS2 XP Calculator & Game Mode Comparison Tool.

This module provides exact XP calculation formulas, bonus tiers,
and minute-per-XP rate comparisons across all Counter-Strike 2 modes.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
import json


@dataclass
class MatchResult:
    mode: str
    duration_minutes: float
    rounds_won: Optional[int] = None
    score: Optional[int] = None
    bonus_tier: int = 3  # Default to 3 (1x base rate) to focus on pure base XP


# Multipliers for Base XP
BASE_FORMULAS = {
    "premier": {"type": "rounds", "mult": 30, "name": "Premier / Competitive"},
    "competitive": {"type": "rounds", "mult": 30, "name": "Competitive"},
    "wingman": {"type": "rounds", "mult": 15, "name": "Wingman (2v2)"},
    "rush": {"type": "rounds", "mult": 10, "name": "Rush (3v3)"},
    "casual": {"type": "score", "mult": 4.0, "name": "Casual"},
    "arms_race": {"type": "score", "mult": 1.0, "name": "Arms Race"},
    "deathmatch": {"type": "score", "mult": 0.2, "name": "Deathmatch"},
    "retakes": {"type": "score", "mult": 2.0, "name": "Retakes"},
}


def calculate_match_xp(match: MatchResult) -> Dict[str, Any]:
    mode_key = match.mode.lower().replace(" ", "_")
    if mode_key not in BASE_FORMULAS:
        raise ValueError(f"Unknown game mode: {match.mode}")

    info = BASE_FORMULAS[mode_key]

    if info["type"] == "rounds":
        if match.rounds_won is None:
            raise ValueError(f"Mode {mode_key} requires 'rounds_won'")
        base_xp = int(match.rounds_won * info["mult"])
    else:
        if match.score is None:
            raise ValueError(f"Mode {mode_key} requires 'score'")
        base_xp = int(match.score * info["mult"])

    duration = max(match.duration_minutes, 0.1)
    base_xp_per_min = round(base_xp / duration, 2)

    return {
        "mode": info["name"],
        "duration_min": duration,
        "base_xp": base_xp,
        "base_xp_per_min": base_xp_per_min,
        "base_xp_per_hour": round(base_xp_per_min * 60, 1),
    }


def print_comparison_table():
    print("=" * 80)
    print(f"{'CS2 BASE XP EFFICIENCY COMPARISON (ACROSS REALISTIC SCENARIOS)':^80}")
    print("=" * 80)
    print(f"{'Scenario / Mode':<30} | {'Formula':<14} | {'Match Time':<11} | {'Base XP':<8} | {'Base XP/m':<10}")
    print("-" * 80)

    scenarios = [
        ("Rush 3v3 (Fast Win: 6-2)", "rush", 5.22, 6, None),
        ("Deathmatch (High: 750 pts)", "deathmatch", 10.0, None, 750),
        ("Casual (High: 60 pts)", "casual", 20.0, None, 60),
        ("Wingman (Win: 9-4)", "wingman", 12.0, 9, None),
        ("Premier (Win: 13-8)", "premier", 35.0, 13, None),
        ("Rush 3v3 (Med Win: 8-4)", "rush", 9.28, 8, None),
        ("Deathmatch (Avg: 500 pts)", "deathmatch", 10.0, None, 500),
        ("Arms Race (Win: 80 pts)", "arms_race", 8.0, None, 80),
        ("Rush 3v3 (Close Win: 8-7)", "rush", 10.85, 8, None),
        ("Casual (Avg: 35 pts)", "casual", 20.0, None, 35),
        ("Retakes (Avg: 35 pts)", "retakes", 10.0, None, 35),
        ("Premier (Loss: 8-13)", "premier", 35.0, 8, None),
        ("Wingman (Loss: 4-9)", "wingman", 12.0, 4, None),
        ("Rush 3v3 (Loss: 2-6)", "rush", 5.22, 2, None),
    ]

    for label, mode, duration, rw, score in scenarios:
        m = MatchResult(mode=mode, duration_minutes=duration, rounds_won=rw, score=score)
        res = calculate_match_xp(m)
        formula_str = f"RW x {BASE_FORMULAS[mode]['mult']}" if BASE_FORMULAS[mode]["type"] == "rounds" else f"Score x {BASE_FORMULAS[mode]['mult']}"
        print(f"{label:<30} | {formula_str:<14} | {f'{duration}m':<11} | {res['base_xp']:<8} | {res['base_xp_per_min']:<10}")

    print("=" * 80)


if __name__ == "__main__":
    print_comparison_table()
