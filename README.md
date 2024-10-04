<h1>Format-Usb-js</h1>
<p>A simple utility for formatting USB drives using JavaScript.</p>
<p>This tool is designed to run in a Linux environment and offers a straightforward interface inspired by <a href="https://github.com/linuxmint/mintstick" target="_blank">Mintstick</a>.</p>

<h2>Key Features</h2>
<p>It utilizes</p>
<ul>
    <li><strong><a href="https://deno.com">Deno</a></strong></li>
    <li><strong> <a href="https://deno.land/x/webview@0.8.0">Webview</a> </strong>, for graphical interface.</li>
</ul>

<h2>Usage</h2>
<p>Download the executable from <strong><a href="https://github.com/tinyCodes1/Format-usb-js/releases/download/v0.1/format-usb">Releases</a></strong> and follow the steps below:</p>
<pre><code>
chmod +x format-usb
./format-usb
</code></pre>

<h2>Building from Source</h2>
<p>If you want to build the project from the source code, run the following command:</p>
<pre><code>
git clone git@github.com:tinyCodes1/Format-usb-js.git
cd Format-usb-js
curl -L -O -C - https://github.com/denoland/deno/releases/download/v1.46.3/deno-x86_64-unknown-linux-gnu.zip
unzip deno-x86_64-unknown-linux-gnu.zip
chmod +x ./deno
./deno run -A make.ts
</code></pre>

<h2>License</h2>
<p>Available under the <strong>MIT License</strong>.</p>
