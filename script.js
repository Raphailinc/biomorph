class Biomorph {
  constructor(genome = []) {
    this.genome = genome;
  }

  randomGenome() {
    const length = 32 + Math.floor(Math.random() * 32);
    this.genome = Array.from({ length }, () => [
      Math.floor(Math.random() * 6),
      Math.floor(Math.random() * 25 - 12)
    ]);
  }

  reproduce() {
    const offspring = new Biomorph();
    const mutationLoc = Math.floor(this.genome.length * Math.random());

    for (let i = 0; i < this.genome.length; i++) {
      let mutationType = 0;
      if (i === mutationLoc) mutationType = Math.floor(1 + 6 * Math.random());

      switch (mutationType) {
        case 1: // point delta
          offspring.genome.push([this.genome[i][0], this.genome[i][1] + Math.floor(3 * Math.random() - 1)]);
          break;
        case 2: // change command
          offspring.genome.push([Math.floor(6 * Math.random()), this.genome[i][1]]);
          break;
        case 3: // duplicate gene
          offspring.genome.push(this.genome[i], this.genome[i]);
          break;
        case 4: // insert random gene
          offspring.genome.push(this.genome[i], [Math.floor(6 * Math.random()), Math.floor(25 * Math.random() - 12)]);
          break;
        case 5:
        case 6: // delete gene
          break;
        default:
          offspring.genome.push(this.genome[i]);
      }
    }
    return offspring;
  }

  draw(ctx, x, y, scale, angle) {
    const strokes = [
      { x: 0, y: 0, a: 0, f: false, i: 0, p: [] },
      { x: 0, y: 0, a: 0, f: true, i: 0, p: [] }
    ];
    const paths = [];
    let bound = 1;

    const addVec = (p1, p2) => [p1[0] + p2[0], p1[1] + p2[1]];
    const minusVec = (p1, p2) => [p1[0] - p2[0], p1[1] - p2[1]];
    const mult = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1], m[1][0] * v[0] + m[1][1] * v[1]];

    const growNewPoint = (ptA, ptC, left) => {
      const leftM = [
        [0.5, -0.5],
        [0.5, 0.5]
      ];
      const rightM = [
        [0.5, 0.5],
        [-0.5, 0.5]
      ];
      return addVec(ptA, mult(left ? leftM : rightM, minusVec(ptC, ptA)));
    };

    while (strokes.length > 0) {
      paths.unshift([[strokes[0].x, strokes[0].y]]);
      while (strokes[0].i < this.genome.length) {
        if (!strokes[0].p.includes(strokes[0].i)) {
          const gene = this.genome[strokes[0].i];
          switch (gene[0]) {
            case 0: {
              const newStroke = {
                x: strokes[0].x,
                y: strokes[0].y,
                a: strokes[0].a,
                f: strokes[0].f,
                i: Math.max(0, strokes[0].i + Math.abs(gene[1]) + 1),
                p: strokes[0].p.concat(strokes[0].i)
              };
              strokes.push(newStroke);
              break;
            }
            case 1:
              strokes[0].p.push(strokes[0].i);
              strokes[0].i = Math.max(0, strokes[0].i - Math.floor(gene[1] / 2));
              break;
            case 2:
              strokes[0].a += gene[1] * (strokes[0].f ? 1 : -1);
              break;
            case 3:
              strokes[0].f = !strokes[0].f;
              break;
            case 4:
              strokes[0].x += Math.cos((Math.PI * strokes[0].a) / 12);
              strokes[0].y += Math.sin((Math.PI * strokes[0].a) / 12);
              paths[0].push([strokes[0].x, strokes[0].y]);
              bound = Math.max(bound, Math.abs(strokes[0].x), Math.abs(strokes[0].y));
              break;
            case 5:
              // junk DNA
              break;
          }
        }
        strokes[0].i++;
      }
      strokes.shift();
    }

    const scale2 = scale / bound;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e5e7eb";
    paths.forEach((path) => {
      ctx.beginPath();
      ctx.moveTo(
        x + scale2 * (Math.cos(angle) * path[0][0] - Math.sin(angle) * path[0][1]),
        y + scale2 * (Math.sin(angle) * path[0][0] + Math.cos(angle) * path[0][1])
      );
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(
          x + scale2 * (Math.cos(angle) * path[i][0] - Math.sin(angle) * path[i][1]),
          y + scale2 * (Math.sin(angle) * path[i][0] + Math.cos(angle) * path[i][1])
        );
      }
      ctx.stroke();
    });
  }
}

const gridEl = document.getElementById("biomorph-grid");
const genomeInput = document.getElementById("genome-input");
const statusEl = document.getElementById("status");

const GRID_ROWS = 3;
const GRID_COLS = 4;
const CELL_SIZE = 150;

let canvases = [];
let selectedIndex = 0;

function initGrid() {
  gridEl.innerHTML = "";
  canvases = [];
  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    const canvas = document.createElement("canvas");
    canvas.width = CELL_SIZE;
    canvas.height = CELL_SIZE;
    cell.appendChild(canvas);
    gridEl.appendChild(cell);

    const ctx = canvas.getContext("2d");
    const morph = new Biomorph();
    morph.randomGenome();
    morph.draw(ctx, CELL_SIZE / 2, CELL_SIZE / 2, 60, Math.PI / 2);

    canvases.push({ cell, canvas, ctx, morph });

    cell.addEventListener("click", () => selectParent(i));
  }
  selectParent(0, false);
}

function selectParent(idx, mutate = true) {
  selectedIndex = idx;
  canvases.forEach((c, i) => {
    c.cell.classList.toggle("selected", i === idx);
  });
  genomeInput.value = JSON.stringify(canvases[idx].morph.genome);

  if (mutate) {
    for (let i = 0; i < canvases.length; i++) {
      if (i === idx) continue;
      canvases[i].morph = canvases[idx].morph.reproduce();
      canvases[i].morph.draw(canvases[i].ctx, CELL_SIZE / 2, CELL_SIZE / 2, 60, Math.PI / 2);
    }
  }
}

function randomizeAll() {
  canvases.forEach((c) => {
    c.morph.randomGenome();
    c.morph.draw(c.ctx, CELL_SIZE / 2, CELL_SIZE / 2, 60, Math.PI / 2);
  });
  selectParent(0, false);
}

document.getElementById("randomize").addEventListener("click", randomizeAll);
document.getElementById("copy-genome").addEventListener("click", () => {
  navigator.clipboard.writeText(genomeInput.value).then(() => {
    statusEl.textContent = "Скопировано";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  });
});

document.getElementById("apply-genome").addEventListener("click", () => {
  try {
    const parsed = JSON.parse(genomeInput.value);
    if (!Array.isArray(parsed)) throw new Error("Ожидается массив");
    canvases[selectedIndex].morph = new Biomorph(parsed);
    canvases[selectedIndex].morph.draw(
      canvases[selectedIndex].ctx,
      CELL_SIZE / 2,
      CELL_SIZE / 2,
      60,
      Math.PI / 2
    );
    statusEl.textContent = "Геном загружен";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  } catch (e) {
    statusEl.textContent = "Неверный формат генома";
    setTimeout(() => (statusEl.textContent = ""), 2000);
  }
});

initGrid();
