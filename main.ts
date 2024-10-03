import { Webview, SizeHint } from "./webview.ts";
import {log,run,sudorun,debug} from "./predef.ts";


const getUsbLine=():string[]=>{
  const usbLineAr : string[] = [];
  const lsblk = run(`lsblk -r -o NAME,MODEL,LABEL,SIZE,TRAN,MOUNTPOINT`, `out`);
  const deviceAr = lsblk.split(`\n`);
  for (const deviceLine of deviceAr) {
    const deviceInfo = deviceLine.split(` `);
    if (deviceInfo[4] == `usb`) {
      usbLineAr.push(deviceLine);
    }
  }
  return usbLineAr;
}

const umount=(device:string)=> {
  const list = run(`lsblk -r /dev/${device} -o NAME,MOUNTPOINT`, `out`) ;
  const lines = list.split(`\n`);
  const mountpoints : string[] = [];
  for (const line of lines) {
    const wordAr = line.split(` `);
    if ((wordAr[0].includes(device)) && (wordAr[1]))
      mountpoints.push(wordAr[1]);
  }
  for (const mpt of mountpoints) {
    run(`umount ${mpt}`);
  }
}

const getFormated=(usbId:string, label_unf:string, type:string )=>{
  const label = label_unf.replace(/\s+/g,``).replace(/\./g,`_`);
  let rv = `err`;
  log(`formating: ${usbId} , ${label}, ${type}`);
  umount(usbId);
  const sfdisk = `echo ',,' | sfdisk /dev/${usbId} -w always`;
  let mkfs = `mkfs.vfat -F 32 /dev/${usbId}1 -n ${label}`;
  if (type === `EXFAT`) {
    mkfs = `mkfs.exfat /dev/${usbId}1 -n ${label}`;
  } else if (type === `EXT4`) {
    mkfs = `mkfs.ext4 /dev/${usbId}1 -L ${label}`;
  }
  const formatScript = `${sfdisk} && ${mkfs}`; 
  const tempSh = Deno.makeTempFileSync({prefix: `format_`, suffix:`.sh`});
  Deno.writeTextFileSync(tempSh, formatScript);
  const r = sudorun(tempSh);
  Deno.removeSync(tempSh); 
  if ( r === `0` ) {
    rv = `success`;
  }
  return rv;
}


const htmldata = Deno.readTextFileSync(`index.b.html`);


const win = new Webview(false);
win.size = {width:400, height:368, hint: SizeHint.FIXED};
win.title = `Format USB`;
const rerun=()=>{
  win.navigate(`data:text/html,${encodeURIComponent(htmldata)}`);
  win.run();
}
win.bind("getUsbLine", getUsbLine);
win.bind("getFormated", getFormated);
win.bind(`rerun`, rerun);
win.navigate(`data:text/html,${encodeURIComponent(htmldata)}`);
win.run();


