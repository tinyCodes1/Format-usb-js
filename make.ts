#!/usr/bin/env -S deno run --ext=ts --allow-write --allow-run --allow-env --allow-read

/**
 *  Caution : build folder will be auto-deleted, Internet required for compilation
 */

interface outObj {
  stdout : Uint8Array,
  stderr : Uint8Array
}
const decoder = new TextDecoder();
const log =(obj: outObj)=> {
  const textout = decoder.decode(obj.stdout);
  console.log(textout);
  const texterr = decoder.decode(obj.stderr);
  console.log(texterr);
}


const removeContent = async(dir:string) => {
  try {
    const list = Deno.readDirSync(dir);
    for await (const file of list) {
      const filepath = `${dir}/${file.name}`;
      if (file.isDirectory) {
        await removeContent(filepath);
      } else if (file.isSymlink) {
        Deno.removeSync(filepath);
      } else if (file.isFile) {
        Deno.removeSync(filepath);
      }
    }
    Deno.removeSync(dir);
  } catch (err) {
    console.log(err);
  }
}

const main=async()=>{
  try {
    Deno.mkdirSync(`build`);
  } catch (err) {
    if (err.name == `AlreadyExists`) {
      console.log(`directory "build" already exist. will be deleted.`);
    } else {
      console.log(err);
    }
  }


  // 1. copy files
  //  Deno.copyFileSync(`sep.ts`, `build/sep.ts`);
  Deno.copyFileSync(`webview.ts`, `build/webview.ts`);
  Deno.copyFileSync(`libwebview.ts`, `build/libwebview.ts`);
  Deno.copyFileSync(`predef.ts`, `build/predef.ts`);

  // 2. make script.js
  const bundle =  new Deno.Command("./deno", { args: [ "bundle", "--no-check", "script.ts", "script.js" ] }).outputSync();
  log(bundle);

  // 3. make build/index.b.html
  const compil = new Deno.Command("./deno", { args: [ "run", "--allow-read", "--allow-net", "--allow-run", "--allow-env", "--allow-write", "compil.ts", "index.html" ] }).outputSync();
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
  const mainjs =  new Deno.Command("./deno", { args: [ "bundle", "--no-check", "build/main.ts", "build/main.js" ]}).outputSync();
  log(mainjs);


  // 6. make executable 
  try {
    Deno.mkdirSync(`Dist`);
  } catch (err) {
    if (err.name == `AlreadyExists`) {
      console.log(`directory "build" already exist. will be deleted.`);
    } else {
      console.log(err);
    }
  }
  const exec = new Deno.Command("./deno", { args: [ "compile", "--no-check", "--unstable-ffi", "-A", "-o", "Dist/format-usb", "build/main.js" ] }).outputSync();
  log(exec);
  await removeContent(`build`);
 Deno.removeSync(`script.js`); 

};

await main();
