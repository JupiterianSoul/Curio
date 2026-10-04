'use strict';
window.MS_DATA = {
  levels: {
    beginner: { name: 'Beginner', rows: 9, cols: 9, mines: 10, cell: 38 },
    intermediate: { name: 'Intermediate', rows: 16, cols: 16, mines: 40, cell: 32 },
    expert: { name: 'Expert', rows: 16, cols: 30, mines: 99, cell: 28 }
  },
  skins: {
    tabletop: {
      name: 'Wooden tray', sw: ['#d6a96a', '#2f6b47'],
      light: { cov: '#dcb47e', covAlt: '#d4aa72', hi: '#f2d6a6', lo: '#9a6c3c', open: '#2f6b47', openAlt: '#2b6442', line: '#245739', frame: '#5e3d1f', mine: '#1c1a17', flag: '#d8312a', pole: '#4a2f16', boom: '#ff6a3a', nums: ['#9fd0ff', '#b9f28a', '#ffb0a0', '#e0b8ff', '#ffd27a', '#7fe8e0', '#ffffff', '#d0d0d0'] },
      dark: { cov: '#a87b4c', covAlt: '#a07446', hi: '#c49868', lo: '#6e4a26', open: '#1d3f2b', openAlt: '#1b3a28', line: '#163222', frame: '#3e2812', mine: '#f2e6d0', flag: '#ff5a4f', pole: '#e0c9a6', boom: '#c23a2c', nums: ['#8fc4ff', '#a6ec7a', '#ff9a8a', '#d2a6ff', '#ffc85a', '#6fe0d8', '#ffffff', '#cfcfcf'] }
    },
    classic: {
      name: 'Classic', sw: ['#b9c7d4', '#eef1f4'],
      light: { cov: '#b9c7d4', covAlt: '#b3c2cf', hi: '#d3dde6', lo: '#8fa1b2', open: '#eef1f4', openAlt: '#e9edf1', line: '#cfd7df', frame: '#8fa1b2', mine: '#1d2733', flag: '#e0352b', pole: '#2b3440', boom: '#ff5a4f', nums: ['#1e63d6', '#1d8a3a', '#d63a2f', '#2b2c8f', '#8a2222', '#0e8b8b', '#222222', '#777777'] },
      dark: { cov: '#4a5663', covAlt: '#465260', hi: '#5d6a78', lo: '#343d47', open: '#22262b', openAlt: '#25292f', line: '#30363d', frame: '#343d47', mine: '#e8edf3', flag: '#ff6a5f', pole: '#cfd6de', boom: '#c7362c', nums: ['#6aa3ff', '#5fd07a', '#ff7a6e', '#a9a6ff', '#ff9a7a', '#4fd6d6', '#eeeeee', '#aaaaaa'] }
    },
    meadow: {
      name: 'Meadow', sw: ['#7ccc4f', '#e8c99b'],
      light: { cov: '#8ad15a', covAlt: '#7cc64c', hi: '#a6e07c', lo: '#5ea93a', open: '#ecd2a6', openAlt: '#e2c595', line: '#d9bb8a', frame: '#4f8f30', mine: '#3b2a1a', flag: '#e8344e', pole: '#5a3a1e', boom: '#ff6a4a', nums: ['#2f6fd6', '#2e8a3a', '#d6402f', '#6a2fa8', '#a8541f', '#1a8a8a', '#3a2a1a', '#7a6a5a'] },
      dark: { cov: '#3f7a2a', covAlt: '#397226', hi: '#4e8f36', lo: '#2b5a1c', open: '#3a2f22', openAlt: '#352b1f', line: '#2b2219', frame: '#2b5a1c', mine: '#f2e6d0', flag: '#ff5a6e', pole: '#e0c9a6', boom: '#b8402a', nums: ['#7fb2ff', '#7fe08a', '#ff8a7a', '#c9a0ff', '#ffb27a', '#6fe0e0', '#f2e6d0', '#c8b8a0'] }
    },
    ocean: {
      name: 'Ocean', sw: ['#3d8fd6', '#f3e3b5'],
      light: { cov: '#4a9be0', covAlt: '#4293d8', hi: '#7ab8ee', lo: '#2f74b8', open: '#f6e8c0', openAlt: '#efdfb2', line: '#e6d29e', frame: '#2a6aa8', mine: '#24323f', flag: '#ff7a2b', pole: '#3a2a1a', boom: '#ff5a3a', nums: ['#1f5fc4', '#1f8a6a', '#d6402f', '#3a2f9a', '#9a3a2a', '#0e8b8b', '#24323f', '#7a7a7a'] },
      dark: { cov: '#1f4f7a', covAlt: '#1c4970', hi: '#2c6494', lo: '#143656', open: '#2b2a24', openAlt: '#29281f', line: '#201f1a', frame: '#143656', mine: '#e6eef6', flag: '#ff8a3d', pole: '#e6d3b0', boom: '#b8402a', nums: ['#7fb8ff', '#6fe0b8', '#ff8a7a', '#b0a6ff', '#ffaa8a', '#5fe0e0', '#e6eef6', '#b0b0b0'] }
    },
    candy: {
      name: 'Candy', sw: ['#ff9ec7', '#fff4e8'],
      light: { cov: '#ff9ec7', covAlt: '#ff93bf', hi: '#ffc2dd', lo: '#e57aa9', open: '#fff4e8', openAlt: '#fdeedd', line: '#f6dcc6', frame: '#d9649a', mine: '#5a2a5a', flag: '#7a3cff', pole: '#5a2a5a', boom: '#ff4f7a', nums: ['#ff3d7f', '#2fb36a', '#ff7a1a', '#7a3cff', '#c2185b', '#00a3a3', '#5a2a5a', '#9a7a8a'] },
      dark: { cov: '#a8507a', covAlt: '#a04a74', hi: '#c06690', lo: '#7a3558', open: '#2e2129', openAlt: '#2b1e26', line: '#241a20', frame: '#7a3558', mine: '#ffe6f2', flag: '#b48cff', pole: '#ffe6f2', boom: '#c23a64', nums: ['#ff7aa8', '#6fe0a0', '#ffaa5a', '#b48cff', '#ff6fa0', '#5fe0e0', '#ffe6f2', '#c8a8b8'] }
    },
    neon: {
      name: 'Neon', sw: ['#2a2350', '#0d0b18'],
      light: { cov: '#2a2350', covAlt: '#272049', hi: '#4a3f8a', lo: '#18132f', open: '#0f0c1d', openAlt: '#120f22', line: '#1d1838', frame: '#6b5cff', mine: '#ff3df0', flag: '#00f0ff', pole: '#b9b0ff', boom: '#ff2e6a', nums: ['#00e5ff', '#76ff03', '#ff4081', '#b388ff', '#ffea00', '#18ffff', '#ffffff', '#9e9e9e'] },
      dark: { cov: '#2a2350', covAlt: '#272049', hi: '#4a3f8a', lo: '#18132f', open: '#0f0c1d', openAlt: '#120f22', line: '#1d1838', frame: '#6b5cff', mine: '#ff3df0', flag: '#00f0ff', pole: '#b9b0ff', boom: '#ff2e6a', nums: ['#00e5ff', '#76ff03', '#ff4081', '#b388ff', '#ffea00', '#18ffff', '#ffffff', '#9e9e9e'] },
      glow: true
    }
  },
  tips: [
    'A 1 touching exactly one hidden square means that square is a mine.',
    'The pattern 1-2-1 along a wall: the mines sit under the 1s.',
    'The pattern 1-2-2-1 along a wall: the mines sit under the 2s.',
    'If a number already has all its mines flagged, click it to open every other neighbour at once (chording).',
    'Corner squares have the fewest neighbours, so when you must guess they are the likeliest to be zeros and open a big area.',
    'In no-guess mode, every board can be solved by logic alone. If you are stuck, look harder.',
    'The mine counter assumes your flags are right. It cannot check your homework.',
    'Minesweeper shipped with Windows 3.1 in 1992 and was a sneaky way to teach people to right-click.'
  ]
};
