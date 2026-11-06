// Visuels de remplissage (BRIEF V2 §3) : dessins vectoriels abstraits, jamais présentés comme des photos SIBM.
// Chaque visuel porte data-filler="true" et figure dans FILLER_REPORT.md. Aucune cote chiffrée (règle « pas de dimensions »).

const svg = (vb, body, cls = 'bp', label = '') =>
  `<svg class="${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} data-filler="true" focusable="false">${body}</svg>`;

// ligne de cote sans valeur : deux traits d'attache et une flèche rouge
const dim = (x1, y1, x2, y2) => {
  const v = x1 === x2;
  const t = 6;
  return `<path class="d" d="M${x1} ${y1}L${x2} ${y2}"/><path class="a" d="M${v ? x1 - t : x1} ${v ? y1 : y1 - t}L${v ? x1 + t : x1} ${v ? y1 : y1 + t}M${v ? x2 - t : x2} ${v ? y2 : y2 - t}L${v ? x2 + t : x2} ${v ? y2 : y2 + t}"/>`;
};

// ------------------------------------------------------------------ plans par famille (400 x 300)
export const blueprints = {
  'voirie-pavage': svg('0 0 400 300', `
    <path class="f" d="M60 250 L170 70 L230 70 L340 250 Z"/>
    <path class="s" d="M60 250 L170 70 M340 250 L230 70 M40 250 L160 70 M360 250 L240 70"/>
    <path class="s" d="M80 220 L320 220 M98 190 L302 190 M115 162 L285 162 M131 136 L269 136 M145 112 L255 112 M158 90 L242 90"/>
    <path class="s" d="M140 250 L188 70 M200 250 L200 70 M260 250 L212 70"/>
    ${dim(40, 275, 360, 275)}
    <path class="a" d="M200 40 L200 58 M194 52 L200 58 L206 52"/>`),
  'maconnerie-murs': svg('0 0 400 300', `
    <path class="f" d="M70 110 H330 V230 H70 Z"/>
    <path class="s" d="M70 110 H330 V230 H70 Z M70 150 H330 M70 190 H330 M135 110 V150 M200 110 V150 M265 110 V150 M102 150 V190 M167 150 V190 M232 150 V190 M297 150 V190 M135 190 V230 M200 190 V230 M265 190 V230"/>
    <path class="s" d="M150 40 H250 V90 H150 Z M162 50 H192 V80 H162 Z M208 50 H238 V80 H208 Z"/>
    ${dim(70, 255, 330, 255)}${dim(350, 110, 350, 230)}`),
  'structure-planchers': svg('0 0 400 300', `
    <path class="f" d="M40 120 H360 V190 H40 Z"/>
    <path class="s" d="M40 120 H360 V190 H40 Z"/>
    <circle class="s" cx="80" cy="155" r="22"/><circle class="s" cx="140" cy="155" r="22"/><circle class="s" cx="200" cy="155" r="22"/><circle class="s" cx="260" cy="155" r="22"/><circle class="s" cx="320" cy="155" r="22"/>
    <path class="d" d="M40 155 H360"/>
    <path class="s" d="M40 190 L60 230 H340 L360 190"/>
    <path class="a" d="M70 70 L70 112 M64 104 L70 112 L76 104 M200 70 L200 112 M194 104 L200 112 L206 104 M330 70 L330 112 M324 104 L330 112 L336 104"/>
    ${dim(40, 260, 360, 260)}`),
  'hydraulique-assainissement': svg('0 0 400 300', `
    <path class="f" d="M60 100 H200 V220 H60 Z"/>
    <path class="s" d="M60 100 H200 V220 H60 Z M78 118 H182 V202 H78 Z"/>
    <ellipse class="s" cx="290" cy="160" rx="62" ry="62"/><ellipse class="s" cx="290" cy="160" rx="46" ry="46"/>
    <path class="d" d="M290 80 V240 M210 160 H370"/>
    <path class="a" d="M86 190 C110 175 150 175 174 190"/>
    ${dim(60, 250, 200, 250)}${dim(228, 250, 352, 250)}`),
  'energie-rail': svg('0 0 400 300', `
    <path class="s" d="M110 40 L100 260 M120 40 L130 260 M110 40 H120 M60 70 H170 M70 70 L110 100 M160 70 L120 100"/>
    <circle class="s" cx="66" cy="62" r="5"/><circle class="s" cx="164" cy="62" r="5"/>
    <path class="f" d="M210 200 H380 V230 H210 Z"/>
    <path class="s" d="M210 200 H260 V230 H210 Z M330 200 H380 V230 H330 Z M260 212 H330 M260 218 H330"/>
    <path class="s" d="M232 186 V200 M358 186 V200 M200 186 H390"/>
    ${dim(210, 255, 380, 255)}${dim(80, 40, 80, 260)}`),
  'beton-sec': svg('0 0 400 300', `
    <path class="f" d="M130 70 Q120 60 135 55 H265 Q280 60 270 70 L285 235 Q285 250 265 250 H135 Q115 250 115 235 Z"/>
    <path class="s" d="M130 70 Q120 60 135 55 H265 Q280 60 270 70 L285 235 Q285 250 265 250 H135 Q115 250 115 235 Z M150 55 Q200 72 250 55"/>
    <path class="s" d="M150 140 H250 M150 165 H230"/>
    <circle class="s" cx="320" cy="215" r="6"/><circle class="s" cx="338" cy="232" r="4"/><circle class="s" cx="305" cy="238" r="5"/><circle class="s" cx="80" cy="225" r="5"/><circle class="s" cx="64" cy="240" r="3"/>
    <path class="a" d="M200 110 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0"/>
    ${dim(115, 272, 285, 272)}`),
};

// ------------------------------------------------------------------ grands ouvrages (1000 x 600)
const grid = Array.from({ length: 11 }, (_, i) => `M${i * 100} 0V600`).join('') + Array.from({ length: 7 }, (_, i) => `M0 ${i * 100}H1000`).join('');
export const landmarks = {
  bridge: svg('0 0 1000 600', `<path class="g" d="${grid}"/>
    <path class="s" d="M40 330 H960 M40 350 H960"/>
    <path class="s" d="M120 350 V520 M300 350 V520 M480 350 V520 M660 350 V520 M840 350 V520"/>
    <path class="s" d="M120 350 Q210 410 300 350 Q390 410 480 350 Q570 410 660 350 Q750 410 840 350"/>
    <path class="s" d="M100 520 H140 M280 520 H320 M460 520 H500 M640 520 H680 M820 520 H860"/>
    <path class="a" d="M0 470 Q120 455 250 470 T500 470 T750 470 T1000 470"/>
    <path class="s" d="M70 330 V300 H930 V330"/>`, 'story-art'),
  basilica: svg('0 0 1000 600', `<path class="g" d="${grid}"/>
    <path class="s" d="M300 520 H700 M330 520 V330 H670 V520"/>
    <path class="s" d="M360 330 Q500 120 640 330"/><path class="s" d="M410 330 Q500 190 590 330"/>
    <path class="s" d="M500 150 V100 M486 116 H514"/>
    <path class="s" d="M360 520 V360 M400 520 V360 M440 520 V360 M480 520 V360 M520 520 V360 M560 520 V360 M600 520 V360 M640 520 V360"/>
    <path class="s" d="M120 520 H300 M120 520 V420 Q210 380 300 420 M700 520 H880 V420 Q790 380 700 420"/>
    <path class="a" d="M60 560 H940"/>`, 'story-art'),
  stadium: svg('0 0 1000 600', `<path class="g" d="${grid}"/>
    <ellipse class="s" cx="500" cy="360" rx="400" ry="150"/><ellipse class="s" cx="500" cy="360" rx="300" ry="100"/>
    <ellipse class="s" cx="500" cy="360" rx="200" ry="60"/>
    <path class="s" d="M100 360 V250 Q500 120 900 250 V360"/>
    <path class="s" d="M180 270 V330 M300 225 V300 M420 205 V285 M580 205 V285 M700 225 V300 M820 270 V330"/>
    <path class="a" d="M300 360 H700"/>`, 'story-art'),
  towers: svg('0 0 1000 600', `<path class="g" d="${grid}"/>
    <path class="s" d="M220 540 V200 H340 V540 M380 540 V90 H500 V540 M540 540 V150 H660 V540 M700 540 V260 H800 V540"/>
    <path class="s" d="M220 260 H340 M220 320 H340 M220 380 H340 M220 440 H340 M380 150 H500 M380 210 H500 M380 270 H500 M380 330 H500 M380 390 H500 M380 450 H500 M540 210 H660 M540 270 H660 M540 330 H660 M540 390 H660 M540 450 H660 M700 320 H800 M700 380 H800 M700 440 H800"/>
    <path class="s" d="M150 540 H870"/>
    <path class="a" d="M440 90 V40"/>`, 'story-art'),
};

// ------------------------------------------------------------------ composition du hero (béton, trames, éléments préfabriqués)
export const heroComposition = `<svg viewBox="0 0 1200 820" aria-hidden="true" data-filler="true" focusable="false">
  <path class="g" d="${Array.from({ length: 13 }, (_, i) => `M${i * 100} 0V820`).join('')}${Array.from({ length: 9 }, (_, i) => `M0 ${i * 100 + 20}H1200`).join('')}"/>
  <path class="p" d="M520 520 L760 400 L1080 560 L840 680 Z"/>
  <path class="p2" d="M520 520 L840 680 L840 720 L520 560 Z"/><path class="p" d="M840 680 L1080 560 L1080 600 L840 720 Z"/>
  <path class="p" d="M560 470 L800 350 L1120 510 L880 630 Z"/>
  <path class="p2" d="M560 470 L880 630 L880 670 L560 510 Z"/><path class="p" d="M880 630 L1120 510 L1120 550 L880 670 Z"/>
  <g class="k"><circle cx="840" cy="230" r="150"/><circle cx="840" cy="230" r="112"/><path d="M690 230 H990 M840 80 V380"/></g>
  <path class="k" d="M360 700 V460 H520 V700 M384 700 V484 H496 V700"/>
  <path class="k" d="M260 760 H1160"/>
  <path class="k" d="M600 760 V720 M700 760 V700 M800 760 V720 M900 760 V700 M1000 760 V720"/>
  <path class="r" d="M960 120 L1140 120 M1140 120 L1140 300"/>
  <path class="r" d="M300 420 L560 290"/>
  <circle class="r" cx="560" cy="290" r="5"/>
</svg>`;

// ------------------------------------------------------------------ carte schématique de la Côte d'Ivoire
// Contour simplifié (longitude, latitude), tracé à la main : à remplacer par un contour officiel (FILLER_REPORT.md).
const border = [
  [-7.53, 4.36], [-7.0, 4.45], [-6.6, 4.7], [-6.1, 4.93], [-5.6, 5.07], [-5.0, 5.15], [-4.6, 5.2], [-4.0, 5.25], [-3.6, 5.15], [-3.1, 5.1],
  [-2.95, 5.6], [-3.25, 6.25], [-3.1, 6.7], [-2.95, 7.25], [-2.8, 7.9], [-2.6, 8.2], [-2.55, 8.8], [-2.7, 9.45],
  [-3.1, 9.85], [-3.6, 9.9], [-4.3, 9.65], [-4.7, 9.75], [-5.1, 10.3], [-5.5, 10.45],
  [-6.0, 10.25], [-6.25, 10.7], [-6.7, 10.4], [-7.0, 10.2], [-7.5, 10.45], [-8.0, 10.3],
  [-8.2, 9.9], [-8.0, 9.4], [-7.75, 8.9], [-8.2, 8.5], [-8.0, 8.3], [-7.95, 7.75], [-8.45, 7.55],
  [-8.3, 7.0], [-8.05, 6.6], [-7.75, 6.3], [-7.5, 5.9], [-7.45, 5.4], [-7.6, 5.1],
];
const K = 60;
export const project = ([lon, lat]) => [+((lon + 8.75) * K).toFixed(1), +((10.85 - lat) * K).toFixed(1)];
export const mapOutline = 'M' + border.map((p) => project(p).join(' ')).join(' L') + ' Z';
export const mapViewBox = '0 0 380 400';
// emplacement des sites sur la carte (position schématique, aucune coordonnée publiée)
export const sitePos = {
  abidjan: [-4.02, 5.42],
  yamoussoukro: [-5.28, 6.82],
  'san-pedro': [-6.64, 4.86],
  bouake: [-5.03, 7.69],
  korhogo: [-5.63, 9.46],
};
