import fs from "node:fs";
import { makeChecks, SKILLS } from "../lib/relearn/curriculum.ts";
fs.writeFileSync(
  "tests/assessment-oracle.json",
  JSON.stringify(
    SKILLS.flatMap((skill) =>
      Array.from({ length: 168 }, (_, seed) =>
        makeChecks(skill, seed).map((task) => ({ skill, seed, ...task })),
      ).flat(),
    ),
  ),
);
