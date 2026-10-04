window.PIZZA_TOPPINGS = (() => {
  const TAU = Math.PI * 2;
  const circle = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const T = {
    pepperoni: { name: 'Pepperoni', size: 16, draw(g) {
      circle(g, 0, 0, 16, '#a8281e'); circle(g, 0, 0, 13.5, '#c8372b');
      [[-5, -4, 2.2], [4, -6, 1.6], [6, 4, 2], [-3, 6, 1.8], [0, 0, 1.4]].forEach(([x, y, r]) => circle(g, x, y, r, '#e8807a'));
    } },
    mushroom: { name: 'Mushroom', size: 15, draw(g) {
      g.fillStyle = '#e9dcc7'; g.strokeStyle = '#8d6e63'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-15, 2); g.bezierCurveTo(-15, -16, 15, -16, 15, 2); g.lineTo(6, 2); g.lineTo(6, 14); g.quadraticCurveTo(0, 17, -6, 14); g.lineTo(-6, 2); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#b39b85'; g.lineWidth = 1.3; g.beginPath();
      for (let i = -10; i <= 10; i += 4) { g.moveTo(i * .9, 0); g.lineTo(i * .5, -7); }
      g.stroke();
    } },
    olive: { name: 'Black olive', size: 9, draw(g) {
      g.strokeStyle = '#1f1f24'; g.lineWidth = 5.5; g.beginPath(); g.arc(0, 0, 6.5, 0, TAU); g.stroke();
      g.strokeStyle = '#4a4a55'; g.lineWidth = 1.5; g.beginPath(); g.arc(-1, -1, 6.5, 3.6, 4.6); g.stroke();
    } },
    greenolive: { name: 'Green olive', size: 9, draw(g) {
      circle(g, 0, 0, 9, '#7d9a2c'); circle(g, 0, 0, 4, '#d8352a'); circle(g, -3.5, -4, 1.6, '#a9c45a');
    } },
    basil: { name: 'Basil', size: 15, draw(g) {
      g.fillStyle = '#2f8a3a'; g.beginPath(); g.moveTo(-16, 0); g.quadraticCurveTo(-2, -14, 16, 0); g.quadraticCurveTo(-2, 14, -16, 0); g.fill();
      g.strokeStyle = '#7fcf6e'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0);
      for (let i = -8; i <= 8; i += 6) { g.moveTo(i, 0); g.lineTo(i + 4, -5); g.moveTo(i, 0); g.lineTo(i + 4, 5); }
      g.stroke();
    } },
    greenpepper: { name: 'Green pepper', size: 14, draw(g) {
      g.lineCap = 'round'; g.strokeStyle = '#2e7d32'; g.lineWidth = 6; g.beginPath(); g.arc(0, 8, 14, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.strokeStyle = '#66bb6a'; g.lineWidth = 2; g.beginPath(); g.arc(0, 8, 14, Math.PI * 1.25, Math.PI * 1.6); g.stroke();
    } },
    redpepper: { name: 'Red pepper', size: 14, draw(g) {
      g.lineCap = 'round'; g.strokeStyle = '#d32f2f'; g.lineWidth = 6; g.beginPath(); g.arc(0, 8, 14, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.strokeStyle = '#ff8a80'; g.lineWidth = 2; g.beginPath(); g.arc(0, 8, 14, Math.PI * 1.25, Math.PI * 1.6); g.stroke();
    } },
    pineapple: { name: 'Pineapple', size: 13, draw(g) {
      g.fillStyle = '#ffd54f'; g.strokeStyle = '#e0a800'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-12, 9); g.lineTo(0, -13); g.lineTo(12, 9); g.quadraticCurveTo(0, 13, -12, 9); g.fill(); g.stroke();
      g.strokeStyle = '#f2b705'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -9); g.lineTo(0, 9); g.moveTo(-5, 0); g.lineTo(-8, 8); g.moveTo(5, 0); g.lineTo(8, 8); g.stroke();
    } },
    ham: { name: 'Ham', size: 13, draw(g) {
      g.fillStyle = '#f19aa8'; g.beginPath(); g.moveTo(-12, -10); g.lineTo(11, -12); g.lineTo(13, 9); g.lineTo(-10, 12); g.closePath(); g.fill();
      g.strokeStyle = '#fbd3da'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-12, -10); g.lineTo(11, -12); g.stroke();
      circle(g, -3, 2, 2, '#e27a8b');
    } },
    onion: { name: 'Red onion', size: 14, draw(g) {
      g.lineCap = 'round'; g.strokeStyle = '#a5559c'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 13, .3, Math.PI * 1.6); g.stroke();
      g.strokeStyle = '#e8c3e4'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 9, .5, Math.PI * 1.4); g.stroke();
    } },
    tomato: { name: 'Tomato', size: 16, draw(g) {
      circle(g, 0, 0, 16, '#d8352a'); circle(g, 0, 0, 13, '#f2665a');
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; g.save(); g.translate(Math.cos(a) * 7, Math.sin(a) * 7); g.rotate(a); circle(g, 0, 0, 3.6, '#ff9e8f'); circle(g, 0, 0, 1.3, '#ffe28a'); g.restore(); }
      circle(g, 0, 0, 3, '#ffb3a8');
    } },
    jalapeno: { name: 'Jalapeño', size: 9, draw(g) {
      circle(g, 0, 0, 9, '#3f7a24'); circle(g, 0, 0, 6.5, '#a6cf6c');
      [[0, -3], [2.6, 1.5], [-2.6, 1.5]].forEach(([x, y]) => circle(g, x, y, 1.5, '#f3f0c8'));
    } },
    sausage: { name: 'Sausage', size: 11, draw(g) {
      g.fillStyle = '#8a4a2a'; g.beginPath();
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 8 + (i % 3) * 2.5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); circle(g, -2, -2, 2, '#b06a40'); circle(g, 3, 2, 1.5, '#5e2f19');
    } },
    bacon: { name: 'Bacon', size: 16, draw(g) {
      g.lineCap = 'round'; g.lineWidth = 8; g.strokeStyle = '#b8473c'; g.beginPath(); g.moveTo(-16, 0); g.bezierCurveTo(-8, -8, -4, 8, 4, 0); g.bezierCurveTo(10, -6, 12, 4, 16, 0); g.stroke();
      g.lineWidth = 2.5; g.strokeStyle = '#f5d1c4'; g.stroke();
    } },
    corn: { name: 'Sweetcorn', size: 8, draw(g) {
      [[-4, -2], [3, -3], [0, 4]].forEach(([x, y]) => { g.fillStyle = '#ffca28'; g.beginPath(); g.ellipse(x, y, 3.6, 3, .4, 0, TAU); g.fill(); circle(g, x - 1, y - 1, 1, '#fff2a8'); });
    } },
    anchovy: { name: 'Anchovy', size: 17, draw(g) {
      g.fillStyle = '#7b7f87'; g.beginPath(); g.moveTo(-17, 0); g.quadraticCurveTo(0, -6, 12, 0); g.quadraticCurveTo(0, 6, -17, 0); g.fill();
      g.beginPath(); g.moveTo(11, 0); g.lineTo(18, -5); g.lineTo(17, 5); g.closePath(); g.fill();
      g.strokeStyle = '#c3c8cf'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-14, -1); g.quadraticCurveTo(0, -4, 10, -1); g.stroke();
      circle(g, -12, -1, 1.2, '#222');
    } },
    shrimp: { name: 'Shrimp', size: 13, draw(g) {
      g.lineCap = 'round'; g.strokeStyle = '#ff8a65'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 9, Math.PI * .1, Math.PI * 1.5); g.stroke();
      g.strokeStyle = '#ffccbc'; g.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) { const a = Math.PI * (.25 + i * .27); g.beginPath(); g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); g.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); g.stroke(); }
      g.fillStyle = '#ff7043'; g.beginPath(); g.moveTo(0, -9); g.lineTo(6, -15); g.lineTo(5, -6); g.fill();
    } },
    egg: { name: 'Egg', size: 17, draw(g) {
      g.fillStyle = '#fffdf6'; g.beginPath();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 14 + Math.sin(i * 2.3) * 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); circle(g, 2, 1, 6.5, '#ffb300'); circle(g, 0, -1, 2, '#ffe082');
    } },
    spinach: { name: 'Spinach', size: 13, draw(g) {
      g.fillStyle = '#1f6b2c'; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-16, 4, -10, -14, 0, -14); g.bezierCurveTo(10, -14, 16, 4, 0, 14); g.fill();
      g.strokeStyle = '#4caf50'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -10); g.stroke();
    } },
    chicken: { name: 'Chicken', size: 11, draw(g) {
      g.fillStyle = '#e8c79a'; g.beginPath(); g.moveTo(-10, -6); g.quadraticCurveTo(0, -12, 10, -6); g.lineTo(9, 7); g.quadraticCurveTo(0, 11, -9, 7); g.closePath(); g.fill();
      g.strokeStyle = '#c19461'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-6, -2); g.lineTo(6, -3); g.moveTo(-5, 3); g.lineTo(5, 3); g.stroke();
    } }
  };
  return T;
})();
