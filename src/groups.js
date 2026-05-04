export const GROUPS = [
  {
    id: 1,
    name: "Ground Force",
    tagline: "1,000 Rep Bodyweight Challenge",
    icon: "💪",
    color: "#ff4d00",
    target: 1000,
    unit: "reps",
    description: "Hit 1,000 total reps of bodyweight movements. Count 500 per side for unilateral exercises.",
    exercises: [
      { id: "pushups",       label: "Push-Ups",       icon: "🫸", bilateral: false, note: "" },
      { id: "leg_raises",    label: "Leg Raises",     icon: "🦵", bilateral: false, note: "" },
      { id: "russian_twist", label: "Russian Twist",  icon: "🌀", bilateral: true,  note: "Count 500 per side → log total" },
      { id: "dead_bug",      label: "Dead Bug",       icon: "🐛", bilateral: true,  note: "Count 500 per side → log total" },
      { id: "squats",        label: "Squats",         icon: "🏋️", bilateral: false, note: "" },
      { id: "lunges",        label: "Lunges",         icon: "🦿", bilateral: true,  note: "Count 500 per leg → log total" },
      { id: "orangetheory",  label: "OrangeTheory",   icon: "🟠", bilateral: false, note: "Log reps performed in class" },
    ]
  },
  {
    id: 2,
    name: "Iron Arms",
    tagline: "500 Rep Upper-Body Isolation",
    icon: "🦾",
    color: "#7c3aed",
    target: 500,
    unit: "reps per side",
    description: "500 reps per side for each movement. Use 10–25 lb weights.",
    exercises: [
      { id: "bicep_curl",     label: "Bicep Curl",       icon: "💪", bilateral: true,  note: "500 per side" },
      { id: "tricep_ext",     label: "Tricep Extension", icon: "🔙", bilateral: true,  note: "500 per side" },
      { id: "shoulder_press", label: "Shoulder Press",   icon: "🙆", bilateral: true,  note: "500 per side" },
      { id: "orangetheory",   label: "OrangeTheory",     icon: "🟠", bilateral: false, note: "Log upper-body reps from class" },
    ]
  },
  {
    id: 3,
    name: "Steady State",
    tagline: "200K Steps + 60 Min Plank",
    icon: "🚶",
    color: "#059669",
    target_steps: 200000,
    target_plank: 60,
    unit: "steps + minutes",
    description: "200,000 steps (avg 10K/day) plus 60 total plank minutes (30 min per side for side planks).",
    exercises: [
      { id: "steps",       label: "Steps",        icon: "👟", bilateral: false, note: "Log daily step count" },
      { id: "plank",       label: "Plank",        icon: "⏱️", bilateral: false, note: "Minutes held", unitOverride: "min" },
      { id: "side_plank",  label: "Side Plank",   icon: "↔️", bilateral: true,  note: "30 min per side → log total", unitOverride: "min" },
    ]
  },
  {
    id: 4,
    name: "Elite 2K",
    tagline: "2,000 Rep Combined Bodyweight",
    icon: "🏆",
    color: "#dc2626",
    target: 2000,
    unit: "reps",
    description: "2,000 combined reps across all Group 1 movements. Mix and match — e.g. 700 push-ups + 700 squats + 600 core.",
    exercises: [
      { id: "pushups",       label: "Push-Ups",       icon: "🫸", bilateral: false, note: "" },
      { id: "leg_raises",    label: "Leg Raises",     icon: "🦵", bilateral: false, note: "" },
      { id: "russian_twist", label: "Russian Twist",  icon: "🌀", bilateral: true,  note: "Count 500 per side" },
      { id: "dead_bug",      label: "Dead Bug",       icon: "🐛", bilateral: true,  note: "Count 500 per side" },
      { id: "squats",        label: "Squats",         icon: "🏋️", bilateral: false, note: "" },
      { id: "lunges",        label: "Lunges",         icon: "🦿", bilateral: true,  note: "Count 500 per leg" },
      { id: "orangetheory",  label: "OrangeTheory",   icon: "🟠", bilateral: false, note: "Log reps from class" },
    ]
  }
];

export function getGroup(id) {
  return GROUPS.find(g => g.id === Number(id));
}

export function getGroupProgress(group, logs) {
  if (!group || !logs) return { pct: 0, summary: {} };
  const summary = {};
  logs.forEach(log => {
    summary[log.exercise_id] = (summary[log.exercise_id] || 0) + log.reps;
  });
  const totalReps = Object.values(summary).reduce((a, b) => a + b, 0);

  if (group.id === 3) {
    const steps = summary["steps"] || 0;
    const plankMins = (summary["plank"] || 0) + (summary["side_plank"] || 0);
    const stepPct = Math.min(100, (steps / group.target_steps) * 100);
    const plankPct = Math.min(100, (plankMins / group.target_plank) * 100);
    return { pct: Math.round((stepPct + plankPct) / 2), steps, plankMins, summary, totalReps };
  }
  const target = group.target || 1000;
  return { pct: Math.min(100, Math.round((totalReps / target) * 100)), totalReps, summary };
}
