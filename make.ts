#!/usr/bin/env -S deno run --ext=ts --allow-write --allow-run --allow-env --allow-read

/**
 *  Caution : build folder will be auto-deleted, Internet required for compilation
 */

import {removeDir, run} from "./predef.ts";
import {cppText} from "./cpptemplate.ts";

const debug = false;

// deno-lint-ignore no-explicit-any
const log=(logMessage:any)=>{
  if (debug) {
    console.log(logMessage);
  }
}


const main=async()=>{
  try {
    Deno.mkdirSync(`build`);
  } catch (err) {
    if (err instanceof Error) {
      if (err.name == `AlreadyExists`) {
        console.log(`directory "build" already exist. will be deleted.`);
      } else {
        console.log(err);
      }
    }
  }


  // 1. copy files
  Deno.copyFileSync(`webview.ts`, `build/webview.ts`);
  Deno.copyFileSync(`libwebview.ts`, `build/libwebview.ts`);
  Deno.copyFileSync(`predef.ts`, `build/predef.ts`);


  // 2. make script.js
  const bundle = run(`./deno run -A bundl.ts script.ts -o script.js`, `out`);
  log(bundle);


  // 3. make build/index.b.html
  const compil = run(`./deno run -A compil.ts index.html`);
  log(compil);
  Deno.renameSync(`index.b.html`, `build/index.b.html`);


  // 4. make build/main.ts
  const indexb = Deno.readTextFileSync(`build/index.b.html`);
  const newindex = indexb.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
  const oldtext = `const htmldata = Deno.readTextFileSync(\`index.b.html\`)`;
  const newtext = `const htmldata = \`\n\n ${newindex} \n\n\`\n`;
  const maints = Deno.readTextFileSync(`main.ts`);
  const newmain = maints.replace(oldtext, newtext);
  Deno.writeTextFileSync(`build/main.ts`, newmain);


  // 5. make build/main.js
  const mainjs = run(`./deno run -A bundl.ts build/main.ts -o build/main.js`);
  log(mainjs);


  // 6. make executable 
  try {
    Deno.mkdirSync(`Dist`);
  } catch (err) {
    if (err instanceof Error) {
      if (err.name == `AlreadyExists`) {
        console.log(`directory "Dist" already exist.`);
      } else {
        console.log(err);
      }
    }
  }
  console.log(`compiling ...`);
  const exec = run(`./deno compile --no-check --unstable-ffi -A -o Dist/format-usb build/main.js`);
  log(exec);


  // 7. make executable - cpp - deno installed
  const mainjsText = Deno.readTextFileSync(`build/main.js`);
  const oldLine = `std::string jsCode = R"()";`;
  const newLine = `std::string jsCode = R"(  ${mainjsText}  )";`;
  const cppFileText = cppText.replace(oldLine, newLine);
  Deno.writeTextFileSync(`build/formatUsb.cpp`, cppFileText );
  const cppmake = run(`g++ -o Dist/format-usb-tiny build/formatUsb.cpp`);
  log(cppmake);


  // 8. Remove files
  await removeDir(`build`);
  Deno.removeSync(`script.js`); 
};

main();
