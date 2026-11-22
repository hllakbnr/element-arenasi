// Oyunu (game/) Android uygulamasının içine (varsayılan: gecko/app/src/main/assets/www) kopyalar ve Android köprüsünü ekler.
import fs from 'node:fs';
const ver=process.argv[2]||JSON.parse(fs.readFileSync('../package.json','utf8')).version;
const out=process.argv[3]||'gecko/app/src/main/assets/www';
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.cpSync('../game',out,{recursive:true});
fs.writeFileSync(out+'/mobile.js',fs.readFileSync('mobile.js','utf8').replace('__EA_VERSION__',ver));
fs.writeFileSync(out+'/native.txt',fs.readFileSync('native-version.txt','utf8').trim()+'\n');
try{fs.copyFileSync('../build/release-notes.md',out+'/release-notes.md')}catch(e){fs.writeFileSync(out+'/release-notes.md','')}
let html=fs.readFileSync(out+'/index.html','utf8');
if(!html.includes('mobile.js')){const i=html.indexOf('<head>');if(i<0)throw new Error('head yok');html=html.slice(0,i+6)+'\n<script src="mobile.js" charset="utf-8"></script>'+html.slice(i+6)}
// çentikli ekranlarda safe-area değerleri gelsin
html=html.replace(/<meta name="viewport" content="([^"]*)"/,(m,c)=>c.includes('viewport-fit')?m:`<meta name="viewport" content="${c},viewport-fit=cover"`);
fs.writeFileSync(out+'/index.html',html);console.log('oyun dosyaları hazır:',out,'sürüm',ver);
