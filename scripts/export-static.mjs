import { access, cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

// Vinext emits its static export under dist/client. Keep the documented,
// host-independent out/ directory separate from its unused server bundle.
const source = resolve("dist/client");
const target = resolve("out");
await access(resolve(source, "index.html"));
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log("Static app exported to out/.");
