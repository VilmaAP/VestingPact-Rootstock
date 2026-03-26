const fs = require("fs");
const path = require("path");

const artifact = require("../artifacts/contracts/VestingPact.sol/VestingPact.json");
const output = `// Auto-generated — do not edit manually\nexport const VESTING_PACT_BYTECODE = "${artifact.bytecode}";\n`;
fs.writeFileSync(
  path.join(__dirname, "../frontend/src/lib/bytecode.js"),
  output
);
console.log("Bytecode exported to frontend/src/lib/bytecode.js");
