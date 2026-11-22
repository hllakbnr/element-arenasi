// Oyunu (game/) Android uygulamasının web klasörüne (www/) kopyalar ve Android köprüsünü ekler.
import fs from 'node:fs';import path from 'node:path';
const ver=process.argv[2]||JSON.parse(fs.readFileSync('../package.json','utf8')).version;
fs.rmSync('www',{recursive:true,force:true});fs.cpSync('../game','www',{recursive:true});
fs.writeFileSync('www/mobile.js',fs.readFileSync('mobile.js','utf8').replace('__EA_VERSION__',ver));
try{fs.copyFileSync('../build/release-notes.md','www/release-notes.md')}catch(e){fs.writeFileSync('www/release-notes.md','')}
let html=fs.readFileSync('www/index.html','utf8');
if(!html.includes('mobile.js')){const i=html.indexOf('<head>');if(i<0)throw new Error('head yok');html=html.slice(0,i+6)+'\n<script src="mobile.js" charset="utf-8"></script>'+html.slice(i+6)}
// çentikli ekranlarda safe-area değerleri gelsin
html=html.replace(/<meta name="viewport" content="([^"]*)"/,(m,c)=>c.includes('viewport-fit')?m:`<meta name="viewport" content="${c},viewport-fit=cover"`);
fs.writeFileSync('www/index.html',html);console.log('www hazır, sürüm',ver);
