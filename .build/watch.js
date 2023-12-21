const esbuild = require("esbuild");
async function watch() {
  let ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    minify: false,
    outfile: "./dist/main.js",
    bundle: true,
    loader: { ".ts": "ts" },
  });
  await ctx.watch();
  console.log('Watching...');
}
watch();