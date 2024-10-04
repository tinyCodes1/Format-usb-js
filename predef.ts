import {dirname} from "jsr:@std/path/dirname";

export const debug = false;

export class usbline { 
  private _line : string;
  constructor(line:string) {
    this._line = line;
  }
  private get usbAr() {
    const unf = this._line.split(` `);
    const formatedAr = unf.map(e=>e.replace(/\\x20/g,` `));
    return formatedAr;
  }
  get line() {
    return this._line;
  }
  get id() {
    return this.usbAr[0];
  }
  get default_name() {
    return this.usbAr[1];
  }
  get name() {
    return this.usbAr[2];
  }
  get size() {
    return this.usbAr[3];
  }
  get deviceType() {
    return this.usbAr[4];
  }
  get mountPoint() {
    return this.usbAr[5];
  }
  get nameSize() {
    let name = this.name;
    if (!name) {
      name = this.default_name;
    }
    return `${name} (${this.size}) [${this.id}]`;
  }
}


export const messageBox=(messageText:string, ok:()=>void, type:`A`|`AA`|`AAA`)=>{
  const box = document.createElement(`dialog`) as HTMLDialogElement;
  const boxText = document.createElement(`p`) as HTMLParagraphElement;
  boxText.innerHTML = messageText;
  box.appendChild(boxText);

  if ((type == `AA`) || (type == `AAA`)) {
    const boxButton_OK = document.createElement(`Input`) as HTMLInputElement;
    boxButton_OK.type = `Button`;
    boxButton_OK.style.width = `auto`;
    boxButton_OK.value = `OK`;
    boxButton_OK.addEventListener(`click`, ()=>{
      box.close();
      ok();
    });
    box.appendChild(boxButton_OK);
  }

  if (type == `AAA`) {
    const boxButton_Cancel = document.createElement(`Input`) as HTMLInputElement;
    boxButton_Cancel.type = `Button`;
    boxButton_Cancel.style.width = `auto`;
    boxButton_Cancel.value = `Cancel`;
    boxButton_Cancel.addEventListener(`click`, ()=>{
      box.close();
    });
    box.appendChild(boxButton_Cancel);
  }
  document.body.appendChild(box);
  box.showModal();
  return {
    close:()=>{box.close()}
  }
}


export const refresh=()=>{
  const box = document.createElement(`dialog`) as HTMLDialogElement;
  const boxRefresh = document.createElement(`div`) as HTMLDivElement;
  boxRefresh.className= `spinner`;
  box.appendChild(boxRefresh);
  document.body.appendChild(box);
  return {
    show:()=>{box.showModal()},
      hide:()=>{box.close()}
  }
}


// deno-lint-ignore no-explicit-any
export const log=(logMessage : any)=>{
  if (debug) { console.log(logMessage); }
}

export const sudorun=(com:string)=>{
  const command = [com];
  command.unshift(`sh`);
  log(command);
  const output = new Deno.Command(`pkexec`, { args: command }).outputSync();
  return ``+output.code;
}


export const run=(com:string, r=`code`) : string=>{
  const decoder = new TextDecoder();
  const command = com.split(` `);
  const commandName = command.shift() as string;
  const output = new Deno.Command(commandName, { args: command }).outputSync();
  log(output);
  const err = decoder.decode(output.stderr);
  log(err);
  const out = decoder.decode(output.stdout);
  log(out);
  let rv = ``+output.code;
  if ( r === `out` ) {
    rv = out;
  } else if ( r === `err` ) {
    rv = err;
  }
  return rv;
}


export const openText=(path:string)=>{
  let filetext = ``;
  try {
    filetext = Deno.readTextFileSync(path);
  } catch (err) {
    log(`file ${path} not exist.`);
  }
  return filetext;
}

export const writeText=(path:string, text:string)=>{
  const dir = dirname(path);
  Deno.mkdirSync(dir, {recursive:true});
  Deno.writeTextFileSync(path,text)

}

export const removeDir = async(dir:string) => {
  try {
    const list = Deno.readDirSync(dir);
    for await (const file of list) {
      const filepath = `${dir}/${file.name}`;
      if (file.isDirectory) {
        await removeDir(filepath);
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

