// Oyunun yazı tiplerini (Shojumaru, Cinzel, Barlow Condensed) indirip oyunun içine koyar.
// Böylece masaüstü uygulamasında ve internetsiz açılışta da yazılar aynı görünür.
import fs from 'node:fs';
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Barlow+Condensed:wght@400;600;700&family=Shojumaru&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
fs.mkdirSync('game/fonts', { recursive: true });
let out = '', last = 0, n = 0;
for (const m of css.matchAll(/url\((https:[^)]+)\)/g)) {
  const name = 'f' + (n++) + '.woff2';
  const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
  fs.writeFileSync('game/fonts/' + name, buf);
  out += css.slice(last, m.index) + 'url(' + name + ')';
  last = m.index + m[0].length;
}
out += css.slice(last);
fs.writeFileSync('game/fonts/fonts.css', out);
let html = fs.readFileSync('game/index.html', 'utf8');
if (!html.includes('fonts/fonts.css')) {
  html = html.replace('<script src="config.js"></script>', '<link rel="stylesheet" href="fonts/fonts.css">\n<script src="config.js"></script>');
  fs.writeFileSync('game/index.html', html);
}
console.log('Yazı tipi dosyası:', n);
