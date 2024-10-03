import {webviewso} from "./libwebview.ts";
import {run,sudorun,openText,writeText} from "./predef.ts";

const encoder2 = new TextEncoder();
let preloaded = false;
const instances = [];
const soPath =  createTempFileFromBase64(webviewso);
const configPath = `${Deno.env.get("HOME")}/.config/Format-usb-js/prev.status` ;

function createTempFileFromBase64(base64: string): string {
    const binaryData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const tempFile = Deno.makeTempFileSync();
    Deno.writeFileSync(tempFile, binaryData);
    return tempFile;
}

function dlopen(symbols) {
    if (Deno.dlopen === undefined) {
        throw new Error("`--unstable-ffi` is required");
    }
    let dlopn =null;
    try {
        dlopn = Deno.dlopen(soPath, symbols);
    } catch (err) {
        writeText(configPath, `status_error`);
    }
    return dlopn;
}

function encodeCString(value) {
    return encoder2.encode(value + "\0");
}

function preload() {
    if (preloaded) return;
    preloaded = true;
}

function unload() {
    for (const instance of instances){
        instance.destroy();
    }
    lib.close();
}

const manageSymlink=()=>{
    let webkitLink : `ok`|`err` = `err`;
    let jscorsLink : `ok`|`err` = `err`;

    const webkits = [];
    const webkitLine = run(`find / -type f -name libwebkit*-*so*`, `out`);
    webkits.push(...webkitLine.split(`\n`));
    const  webkitLine2 = run(`find / -type l -name libwebkit*-*so*`, `out`);
    webkits.push(...webkitLine2.split(`\n`));

    const jscors = [];
    const jsCoreLine = run(`find / -type f -name libjavascriptcore*-*so*`, `out`);
    jscors.push(...jsCoreLine.split(`\n`));
    const jsCoreLine2 = run(`find / -type l -name libjavascriptcore*-*so*`, `out`);
    jscors.push(...jsCoreLine2.split(`\n`));

    for (const webline of webkits) {
        if (webline.includes(`libwebkit2gtk-4.0.so.37`)) {
            webkitLink = `ok`;                 // webkit link working fine
        }
    }

    for (const jsline of jscors) {
        if (jsline.includes(`libjavascriptcoregtk-4.0.so.18`)) {
            jscorsLink = `ok`;                   // jscore link working fine
        }
    }

    if ((jscorsLink == `ok`) && (webkitLink == `ok`)) {                 // both link working fine
        writeText(configPath, `status_ok`);
        //        run(`notify-send webkit2-status Already-Installed`);
        return;
    }

    if ((webkits.length > 0) || (jscors.length > 0)) {      // webkit and jscore is there but not linked.
        run(`notify-send Webkit2-status symlink-updating`);
        const webkitFirstLine = webkits[0] ? webkits[0] : jscors[0];
        const libpathAr = webkitFirstLine.split(`/`);
        libpathAr.pop();
        if ((libpathAr != undefined) && (libpathAr.length > 0)) {

            const libPath = libpathAr.join(`/`);
            const newPath = libPath + `/` + `libwebkit2gtk-4.0.so.37`;
            const c1 = `ln -s ${webkitFirstLine} ${newPath}`;

            const jsFirstLine = jscors[0];
            const jsNewLink = libPath + `/` + `libjavascriptcoregtk-4.0.so.18`;
            const c2 = `ln -s ${jsFirstLine} ${jsNewLink}`;

            const tempsFile = Deno.makeTempFileSync({prefix:`Symlink_`, suffix:`.sh`});
            Deno.writeTextFileSync(tempsFile, `${c1} & ${c2}`);
            sudorun(tempsFile);
            Deno.removeSync(tempsFile);
        }
    }
    if ((webkits.length == 0) || (jscors.length == 0)) {
        run(`notify-send "Webkit2-status" "Kindly-install-webkit2gtk-or-libwebgtk"`);
        return;
    }
}

const status_prev = openText(configPath);
if (status_prev != `status_ok`) {
    manageSymlink();
}

const lib = dlopen({
    "webview_create": {
        parameters: [
            "i32",
            "pointer"
        ],
        result: "pointer"
    },
    "webview_destroy": {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    "webview_run": {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    "webview_terminate": {
        parameters: [
            "pointer"
        ],
        result: "void"
    },
    "webview_get_window": {
        parameters: [
            "pointer"
        ],
        result: "pointer"
    },
    "webview_set_title": {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "void"
    },
    "webview_set_size": {
        parameters: [
            "pointer",
            "i32",
            "i32",
            "i32"
        ],
        result: "void"
    },
    "webview_navigate": {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "void"
    },
    "webview_set_html": {
        parameters: [
            "pointer",
            "pointer"
        ],
        result: "void"
    },
    "webview_init": {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "void"
    },
    "webview_eval": {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "void"
    },
    "webview_bind": {
        parameters: [
            "pointer",
            "buffer",
            "function",
            "pointer"
        ],
        result: "void"
    },
    "webview_unbind": {
        parameters: [
            "pointer",
            "buffer"
        ],
        result: "void"
    },
    "webview_return": {
        parameters: [
            "pointer",
            "buffer",
            "i32",
            "buffer"
        ],
        result: "void"
    }
});
const SizeHint = {
    NONE: 0,
    MIN: 1,
    MAX: 2,
    FIXED: 3
};
class Webview {
    #handle = null;
    #callbacks = new Map();
    get unsafeHandle() {
        return this.#handle;
    }
    get unsafeWindowHandle() {
        return lib.symbols.webview_get_window(this.#handle);
    }
    set size({ width, height, hint }) {
        lib.symbols.webview_set_size(this.#handle, width, height, hint);
    }
    set title(title) {
        lib.symbols.webview_set_title(this.#handle, encodeCString(title));
    }
    constructor(debugOrHandle = false, size = {
        width: 1024,
        height: 768,
        hint: SizeHint.NONE
    }, window = null){
        this.#handle = typeof debugOrHandle === "bigint" || typeof debugOrHandle === "number" ? debugOrHandle : lib.symbols.webview_create(Number(debugOrHandle), window);
        if (size !== undefined) {
            this.size = size;
        }
        instances.push(this);
    }
    destroy() {
        Deno.removeSync(soPath);
        for (const callback of Object.keys(this.#callbacks)){
            this.unbind(callback);
        }
        lib.symbols.webview_terminate(this.#handle);
        lib.symbols.webview_destroy(this.#handle);
        this.#handle = null;
    }
    navigate(url) {
        lib.symbols.webview_navigate(this.#handle, encodeCString(url instanceof URL ? url.toString() : url));
    }
    run() {
        lib.symbols.webview_run(this.#handle);
        this.destroy();
    }
    bindRaw(name, callback, arg = null) {
        const callbackResource = new Deno.UnsafeCallback({
            parameters: [
                "pointer",
                "pointer",
                "pointer"
            ],
            result: "void"
        }, (seqPtr, reqPtr, arg)=>{
            const seq = seqPtr ? new Deno.UnsafePointerView(seqPtr).getCString() : "";
            const req = reqPtr ? new Deno.UnsafePointerView(reqPtr).getCString() : "";
            callback(seq, req, arg);
        });
        this.#callbacks.set(name, callbackResource);
        lib.symbols.webview_bind(this.#handle, encodeCString(name), callbackResource.pointer, arg);
    }
    bind(name, callback) {
        this.bindRaw(name, (seq, req)=>{
            const args = JSON.parse(req);
            let result;
            let success;
            try {
                result = callback(...args);
                success = true;
            } catch (err) {
                result = err;
                success = false;
            }
            if (result instanceof Promise) {
                result.then((result)=>this.return(seq, success ? 0 : 1, JSON.stringify(result)));
            } else {
                this.return(seq, success ? 0 : 1, JSON.stringify(result));
            }
        });
    }
    unbind(name) {
        lib.symbols.webview_unbind(this.#handle, encodeCString(name));
        this.#callbacks.get(name)?.close();
        this.#callbacks.delete(name);
    }
    return(seq, status, result) {
        lib.symbols.webview_return(this.#handle, encodeCString(seq), status, encodeCString(result));
    }
    eval(source) {
        lib.symbols.webview_eval(this.#handle, encodeCString(source));
    }
    init(source) {
        lib.symbols.webview_init(this.#handle, encodeCString(source));
    }
}
export { SizeHint as SizeHint };
export { Webview as Webview };
export { preload as preload, unload as unload };
