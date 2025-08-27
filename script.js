
  const canvas = document.getElementById('tetris');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next');
  const nextCtx = nextCanvas.getContext('2d');

  const ROWS = 20;
  const COLS = 10;
  const BLOCK_SIZE = 24;

  ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
  nextCtx.scale(BLOCK_SIZE / 2, BLOCK_SIZE / 2);

  // Colors for each tetromino type
  const COLORS = [
    null,
    '#f3410bff', // T
    '#0DC2FF', // I
    '#0DFF72', // S
    '#F538FF', // Z
    '#FF8E0D', // L
    '#FFE138', // O
    '#3877FF', // J
  ];

  // Tetromino shapes (matrices)
  const SHAPES = [
    [],
    [[0,1,0],
     [1,1,1],
     [0,0,0]],

    [[0,0,0,0],
     [1,1,1,1],
     [0,0,0,0],
     [0,0,0,0]],

    [[0,1,1],
     [1,1,0],
     [0,0,0]],

    [[1,1,0],
     [0,1,1],
     [0,0,0]],

    [[1,0,0],
     [1,1,1],
     [0,0,0]],

    [[1,1],
     [1,1]],

    [[0,0,1],
     [1,1,1],
     [0,0,0]],
  ];

  function createMatrix(w, h) {
    const matrix = [];
    while(h--) {
      matrix.push(new Array(w).fill(0));
    }
    return matrix;
  }

  function drawMatrix(matrix, offset, ctxToUse = ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        // Make a rainbow color based on block position
        const hue = ((x + offset.x) * 36 + (y + offset.y) * 12) % 360;
        ctxToUse.fillStyle = `hsl(${hue}, 100%, 50%)`;

        ctxToUse.fillRect(x + offset.x, y + offset.y, 1, 1);

        // Outline
        ctxToUse.strokeStyle = '#222';
        ctxToUse.lineWidth = 0.05;
        ctxToUse.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}



  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
        }
      });
    });
  }

  function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for(let y = 0; y < m.length; ++y) {
      for(let x = 0; x < m[y].length; ++x) {
        if(m[y][x] !== 0 &&
          (arena[y + o.y] &&
          arena[y + o.y][x + o.x]) !== 0) {
            return true;
          }
      }
    }
    return false;
  }

  function rotate(matrix, dir) {
    for(let y = 0; y < matrix.length; ++y) {
      for(let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if(dir > 0) {
      matrix.forEach(row => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  function playerReset() {
    const pieces = 'TJZSLOI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
      arena.forEach(row => row.fill(0));
      score = 0;
      updateScore();
    }

    nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    drawNext();
  }

  function createPiece(type) {
    switch(type) {
      case 'T': return SHAPES[1];
      case 'I': return SHAPES[2];
      case 'S': return SHAPES[3];
      case 'Z': return SHAPES[4];
      case 'L': return SHAPES[5];
      case 'O': return SHAPES[6];
      case 'J': return SHAPES[7];
    }
  }

  function arenaSweep() {
    outer: for(let y = arena.length - 1; y >= 0; --y) {
      for(let x = 0; x < arena[y].length; ++x) {
        if(arena[y][x] === 0) {
          continue outer;
        }
      }
      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      ++y;

      score += 10;
      updateScore();
    }
  }

  let arena = createMatrix(COLS, ROWS);

  let player = {
    pos: {x:0, y:0},
    matrix: null,
  };

   let nextPiece = null;
   let dropCounter = 0;
   let dropInterval = 1000;

  let lastTime = 0;
  let score = 0;

  function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if(dropCounter > dropInterval) {
      playerDrop();
    }

    draw();
    requestAnimationFrame(update);
  }

  function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, COLS, ROWS);

    drawMatrix(arena, {x:0, y:0});
    drawMatrix(player.matrix, player.pos);
  }

  function playerDrop() {
    player.pos.y++;
    if(collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      arenaSweep();
      playerReset();
    }
    dropCounter = 0;
  }

  function playerMove(dir) {
    player.pos.x += dir;
    if(collide(arena, player)) {
      player.pos.x -= dir;
    }
  }

  function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while(collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if(offset > player.matrix[0].length) {
        rotate(player.matrix, -dir);
        player.pos.x = pos;
        return;
      }
    }
  }

  function updateScore() {
    document.getElementById('score').innerText = 'Score: ' + score;
  }

  function drawNext() {
    nextCtx.fillStyle = '#111';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    drawMatrix(nextPiece, {x:1, y:1}, nextCtx);
  }

  document.addEventListener('keydown', event => {
    if(event.key === 'ArrowLeft') {
      playerMove(-1);
    } else if(event.key === 'ArrowRight') {
      playerMove(1);
    } else if(event.key === 'ArrowDown') {
      playerDrop();
    } else if(event.key === 'q' || event.key === 'Q') {
      playerRotate(-1);
    } else if(event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
      playerRotate(1);
    }
  });

  playerReset();
  updateScore();
  drawNext();
  update();



