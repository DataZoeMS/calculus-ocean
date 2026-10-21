import { copyFile, mkdir, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const packageRoot = new URL("node_modules/mathjax/", root);
const metadata = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8"));
if (metadata.version !== "3.2.2") throw new Error("Review the MathJax integration before changing its pinned version.");
const output = new URL("vendor/mathjax/", root);
await mkdir(output, { recursive: true });
await copyFile(new URL("es5/tex-svg.js", packageRoot), new URL("tex-svg.js", output));
await copyFile(new URL("LICENSE", packageRoot), new URL("LICENSE", output));
console.log(`Vendored MathJax ${metadata.version}: self-contained TeX/SVG component and license.`);
