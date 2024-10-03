// setInterval(() => { window.location.reload();}, 5000);


import {usbline,messageBox} from './predef.ts';

const usbObjs:usbline[] = [];
let selectedUsb : usbline|undefined; 
// const log = document.getElementById(`log`) as HTMLParagraphElement;

const usbSelect = document.getElementById(`usbselect`) as HTMLSelectElement;
const usblabel = document.getElementById(`usblabel`) as HTMLInputElement;
const usbType = document.getElementById(`usbtype`) as HTMLSelectElement;
const btnFormat = document.getElementById(`btnFormat`) as HTMLInputElement;
const btnRefresh = document.getElementById(`btnRefresh`) as HTMLInputElement;

btnRefresh.addEventListener(`click`, rerun );

btnFormat.addEventListener(`click`, ()=>{
  const usbNameSize = usbSelect.options[usbSelect.selectedIndex].text;
  for (const usbobj of usbObjs) {
    if (usbobj.nameSize === usbNameSize) {
      selectedUsb = new usbline(usbobj.line);
    }
  }
  const type = usbType.options[usbType.selectedIndex].text;  
  let label = usblabel.value;

  if (selectedUsb) {
    if (!label) { label = selectedUsb.default_name; }
    const confirmText = `<strong>USB: </strong>${selectedUsb.nameSize}<br>
    <strong>Device id: </strong>${selectedUsb.id}<br>
    <strong>New Label: </strong>${label}<br>
    <strong>New File-System: </strong>${type}<hr>
    <strong>Format it ?</strong>
    `;
    messageBox(confirmText,()=>{
      const b = messageBox(`Please wait`,()=>{},`A`)
      setTimeout(async()=>{
        if (selectedUsb) {
          const rv = await getFormated(selectedUsb.id, label, type);
          b.close();
          if (rv == `success`) {
            messageBox(`Formated successfully.<br>`, ()=>{}, `AA`);
          } else {
            messageBox(`Error`, ()=>{}, `AA`);
          }
        }
      },1000);
    },`AAA`);
  }
});

const fillSelect=(usbObjs:usbline[])=>{
  for (const usbObj of usbObjs) {
    const opt = document.createElement(`Option`);
    opt.textContent = usbObj.nameSize; 
    usbSelect.appendChild(opt);
  }
}

setTimeout(async()=>{
  const usbList =  await getUsbLine();
  // const usbList = [`this is usb line`];
  for (const usb of usbList) {
    const usbLin = new usbline(usb);
    usbObjs.push(usbLin);
  }
  fillSelect(usbObjs);
},1000)
