(() => {
  const T = window.PIZZA_TOPPINGS;
  const TAU = Math.PI * 2;
  const circle = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  Object.assign(T, {
    salami: { name: 'Salami', size: 17, draw(g) {
      circle(g, 0, 0, 17, '#8f1d2c'); circle(g, 0, 0, 15, '#b23a48');
      [[-6, -5, 2.4], [5, -7, 2], [7, 5, 2.6], [-4, 7, 2.2], [1, 0, 1.8], [-9, 2, 1.5], [10, -1, 1.4]].forEach(([x, y, r]) => circle(g, x, y, r, '#f6d6d6'));
    } },
    prosciutto: { name: 'Prosciutto', size: 17, draw(g) {
      g.fillStyle = '#e88d8f'; g.beginPath(); g.moveTo(-17, -4); g.bezierCurveTo(-10, -14, 4, -2, 17, -10); g.lineTo(15, 6); g.bezierCurveTo(4, 12, -8, 2, -16, 10); g.closePath(); g.fill();
      g.strokeStyle = '#fbe4e2'; g.lineWidth = 3; g.beginPath(); g.moveTo(-16, 9); g.bezierCurveTo(-8, 2, 4, 12, 15, 5); g.stroke();
      g.strokeStyle = '#d06d72'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-10, -4); g.bezierCurveTo(-4, -6, 4, 0, 10, -4); g.stroke();
    } },
    meatball: { name: 'Meatball', size: 12, draw(g) {
      circle(g, 0, 1.5, 12, '#5a2e1b'); circle(g, 0, 0, 11, '#7b4128');
      [[-4, -3, 2], [3, -5, 1.5], [5, 3, 2], [-3, 5, 1.6]].forEach(([x, y, r]) => circle(g, x, y, r, '#94573a'));
      circle(g, -4, -5, 2.5, 'rgba(255,255,255,.25)');
    } },
    artichoke: { name: 'Artichoke', size: 14, draw(g) {
      g.fillStyle = '#9bb05a'; g.strokeStyle = '#6a7d34'; g.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { g.save(); g.rotate(-1 + i * .5); g.beginPath(); g.ellipse(0, -6, 4.5, 9, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
      circle(g, 0, 4, 5.5, '#d8d49a');
    } },
    rocket: { name: 'Rocket', size: 15, draw(g) {
      g.fillStyle = '#3f8f2e'; g.beginPath(); g.moveTo(-15, 2);
      for (let i = 0; i <= 6; i++) { const x = -15 + i * 5; g.lineTo(x, -6 - (i % 2) * 4); }
      g.lineTo(15, 0); for (let i = 6; i >= 0; i--) { const x = -15 + i * 5; g.lineTo(x, 5 + (i % 2) * 3); } g.closePath(); g.fill();
      g.strokeStyle = '#8fd47a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, -1); g.stroke();
    } },
    garlic: { name: 'Roast garlic', size: 9, draw(g) {
      g.fillStyle = '#f1dfae'; g.strokeStyle = '#c9a65c'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(0, -9); g.quadraticCurveTo(9, -2, 6, 8); g.quadraticCurveTo(0, 10, -6, 8); g.quadraticCurveTo(-9, -2, 0, -9); g.fill(); g.stroke();
      circle(g, -2, 2, 2, '#d9b468');
    } },
    sundried: { name: 'Sun-dried tomato', size: 13, draw(g) {
      g.fillStyle = '#8c1c13'; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = 11 + Math.sin(i * 1.7) * 3; g.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * .8); }
      g.closePath(); g.fill();
      g.strokeStyle = '#c43a2c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-8, -2); g.quadraticCurveTo(0, 3, 9, -1); g.stroke();
    } },
    capers: { name: 'Capers', size: 9, draw(g) {
      [[-4, -3], [4, -2], [0, 4]].forEach(([x, y]) => { circle(g, x, y, 3.6, '#5e7a2e'); circle(g, x - 1, y - 1, 1.2, '#a3c06a'); });
    } },
    broccoli: { name: 'Broccoli', size: 14, draw(g) {
      g.fillStyle = '#7fae5b'; g.fillRect(-3, 0, 6, 13);
      [[-7, -3, 7], [0, -7, 8], [7, -3, 7], [0, 0, 6]].forEach(([x, y, r]) => circle(g, x, y, r, '#2e7d32'));
      [[-8, -5], [-2, -10], [5, -8], [9, -2], [0, -3]].forEach(([x, y]) => circle(g, x, y, 1.8, '#4caf50'));
    } },
    potato: { name: 'Potato', size: 15, draw(g) {
      g.fillStyle = '#f2d99a'; g.strokeStyle = '#c99a4b'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 15, 12, 0, 0, TAU); g.fill(); g.stroke();
      [[-5, -3], [4, 3], [6, -5]].forEach(([x, y]) => circle(g, x, y, 1.3, '#d9b46a'));
    } },
    fig: { name: 'Fig', size: 13, draw(g) {
      circle(g, 0, 0, 13, '#5b2a52'); circle(g, 0, 0, 10.5, '#d86a7c');
      g.fillStyle = '#f7c7a3'; g.beginPath(); g.ellipse(0, 0, 6, 7.5, 0, 0, TAU); g.fill();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; circle(g, Math.cos(a) * 7, Math.sin(a) * 7, 1, '#f8e2b6'); }
    } },
    ricotta: { name: 'Ricotta', size: 13, draw(g) {
      g.fillStyle = '#fffdf7'; g.beginPath();
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 10 + (i % 2) * 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); g.strokeStyle = '#e8e2d2'; g.lineWidth = 1.5; g.stroke();
      circle(g, -3, -3, 2.5, '#ffffff');
    } },
    chili: { name: 'Red chili', size: 9, draw(g) {
      circle(g, 0, 0, 9, '#b71c1c'); circle(g, 0, 0, 6.5, '#ef5350');
      [[0, -3], [2.6, 1.5], [-2.6, 1.5]].forEach(([x, y]) => circle(g, x, y, 1.4, '#fff3c4'));
    } },
    feta: { name: 'Feta', size: 9, draw(g) {
      g.fillStyle = '#fbfbf5'; g.strokeStyle = '#dcdccc'; g.lineWidth = 1.2;
      [[-4, -3, 7], [3, 2, 6]].forEach(([x, y, s]) => { g.beginPath(); g.rect(x - s / 2, y - s / 2, s, s); g.fill(); g.stroke(); });
    } },
    pear: { name: 'Pear', size: 15, draw(g) {
      g.fillStyle = '#f4eecb'; g.strokeStyle = '#c3b85a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, -15); g.bezierCurveTo(6, -15, 5, -5, 9, 2); g.bezierCurveTo(13, 12, -13, 12, -9, 2); g.bezierCurveTo(-5, -5, -6, -15, 0, -15); g.fill(); g.stroke();
      g.fillStyle = '#7a5a2a'; g.beginPath(); g.ellipse(0, 3, 1.5, 3, 0, 0, TAU); g.fill();
    } },
    strawberry: { name: 'Strawberry', size: 13, draw(g) {
      g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(0, 13); g.bezierCurveTo(-14, 2, -12, -11, 0, -9); g.bezierCurveTo(12, -11, 14, 2, 0, 13); g.fill();
      g.fillStyle = '#ffcdd2'; g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-7, 1, -6, -6, 0, -5); g.bezierCurveTo(6, -6, 7, 1, 0, 8); g.fill();
      [[-6, -3], [6, -3], [0, 2], [-3, 6], [3, 6]].forEach(([x, y]) => circle(g, x, y, .9, '#fff59d'));
    } },
    marshmallow: { name: 'Marshmallow', size: 10, draw(g) {
      g.fillStyle = '#fffaf3'; g.strokeStyle = '#ead7c3'; g.lineWidth = 1.5; g.beginPath(); g.roundRect ? g.roundRect(-9, -8, 18, 16, 6) : g.rect(-9, -8, 18, 16); g.fill(); g.stroke();
      g.fillStyle = 'rgba(214,150,80,.45)'; g.beginPath(); g.ellipse(3, 2, 4, 3, 0, 0, TAU); g.fill();
    } },
    chocchips: { name: 'Choc chips', size: 9, draw(g) {
      [[-4, -3], [4, -2], [0, 5]].forEach(([x, y]) => { g.fillStyle = '#3e2117'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3.5, y + 2.5); g.lineTo(x - 3.5, y + 2.5); g.closePath(); g.fill(); circle(g, x - 1, y, .8, '#7a4a3a'); });
    } }
  });
})();
