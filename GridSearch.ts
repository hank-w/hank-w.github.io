// Waiting on https://github.com/Microsoft/TypeScript/issues/10178
/// <reference types="d3"/>
/// <reference types='ts-polyfill/lib/es2015-core'>
/// <reference types='ts-polyfill/lib/es2015-collection'>
/// <reference types='ts-polyfill/lib/es2017-typed-arrays'>

// Grid Search
// https://en.wikipedia.org/wiki/A*_search_algorithm

// Max heap based PQ
// https://stackoverflow.com/a/42919752

const _top = 0;
const _parent: (i: number) => number = (i) => ((i + 1) >>> 1) - 1;
const _left: (i: number) => number = (i) => (i << 1) + 1;
const _right: (i: number) => number = (i) => (i + 1) << 1;
class PriorityQueueSet<T> {
  _set: Set<T>;
  _heap: Array<T>;
  _comparator: (a: T, b: T) => boolean;
  constructor(comparator = (a: T, b: T) => a > b) {
    this._set = new Set();
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  push(...values: T[]) {
    values.forEach((value) => {
      this._heap.push(value);
      this._siftUp();
      this._set.add(value);
    });
    return this.size();
  }
  pop() {
    const poppedValue = this._heap[_top];
    const bottom = this.size() - 1;
    if (bottom > _top) {
      this._swap(_top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    this._set.delete(poppedValue);
    return poppedValue;
  }
  has(value: T) {
    return this._set.has(value);
  }
  _greater(i: number, j: number) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i: number, j: number) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > _top && this._greater(node, _parent(node))) {
      this._swap(node, _parent(node));
      node = _parent(node);
    }
  }
  _siftDown() {
    let node = _top;
    while (
      (_left(node) < this.size() && this._greater(_left(node), node)) ||
      (_right(node) < this.size() && this._greater(_right(node), node))
    ) {
      let maxChild =
        _right(node) < this.size() && this._greater(_right(node), _left(node))
          ? _right(node)
          : _left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

const GridSearch = (
  selector: string
): { onclicktouch: (x: number, y: number) => void } => {
  let width: number,
    height: number,
    canvas = d3.select(selector);
  let context = (<HTMLCanvasElement>canvas.node()).getContext("2d", {
    alpha: false,
  });
  width = $(selector).outerWidth();
  height = $(selector).outerHeight();

  // set how the new images are drawn onto the existing image.
  context.globalCompositeOperation = "source-over";
  //context.translate(width / 2, height / 2);
  //context.scale(12, 8);
  //context.lineWidth = 0.2;

  const gridWidth = 50,
    gridHeight = 50;
  let grid: Array<Array<boolean>>;

  function randomize_grid() {
    grid = Array<Array<boolean>>(gridHeight)
      .fill([])
      .map((a, i) =>
        Array<Array<boolean>>(gridWidth)
          .fill([])
          .map((b, j) => {
            i *= 1.0;
            j *= 1.0;
            return (
              -0.4 * Math.random() >
              ((i + j) / (gridHeight + gridWidth)) *
                ((i + j) / (gridHeight + gridWidth) - 1)
            );
          })
      );
    grid[0][0] = grid[0][1] = grid[1][0] = grid[1][1] = false;
    grid[gridWidth - 1][gridHeight - 1] = grid[gridWidth - 1][
      gridHeight - 2
    ] = grid[gridWidth - 2][gridHeight - 1] = grid[gridWidth - 2][
      gridHeight - 2
    ] = false;
  }

  function valid(point: number) {
    return (
      y(point) >= 0 &&
      y(point) < gridHeight &&
      x(point) >= 0 &&
      x(point) < gridWidth &&
      !grid[y(point)][x(point)]
    );
  }
  function dist_between(point1: number, point2: number) {
    return Math.sqrt(
      (y(point1) - y(point2)) * (y(point1) - y(point2)) +
        (x(point1) - x(point2)) * (x(point1) - x(point2))
    );
    //return Math.abs(y(point1) - y(point2)) + Math.abs(x(point1) - x(point2));
  }
  function heuristic_cost_est(point1: number, point2: number) {
    return dist_between(point1, point2);
  }

  // To make it possible to put points into sets, we need primitives.
  const FUDGE = 100000;
  function point(y: number, x: number) {
    return y * FUDGE + x;
  }
  function x(point: number) {
    return point % FUDGE;
  }
  function y(point: number) {
    return Math.floor(point / FUDGE);
  }

  function get(map: Map<number, number>, key: number): number {
    if (map.has(key)) return map.get(key);
    else return Infinity;
  }

  const start = point(0, 0),
    goal = point(gridHeight - 1, gridWidth - 1);
  let gScore: Map<number, number>;
  let fScore: Map<number, number>;
  let closedSet: Set<number>;
  let openSet: PriorityQueueSet<number>;
  let cameFrom: Map<number, number>;

  function init_search() {
    gScore = new Map<number, number>();
    fScore = new Map<number, number>();
    closedSet = new Set<number>();
    openSet = new PriorityQueueSet<number>(
      (a, b) => get(fScore, a) < get(fScore, b)
    );
    openSet.push(start);
    cameFrom = new Map<number, number>();
    gScore.set(start, 0);
    fScore.set(start, get(gScore, start) + heuristic_cost_est(start, goal));
  }

  function init_draw() {
    context.clearRect(0, 0, width, height);
    for (var i = 0; i < gridHeight; i++)
      for (var j = 0; j < gridWidth; j++)
        change_color(point(i, j), grid[i][j] ? BLOCKED : UNEXPLORED);
  }

  function change_color(p: number, color: string) {
    context.fillStyle = color;
    context.fillRect(
      (y(p) * width) / gridWidth,
      (x(p) * height) / gridHeight,
      width / gridWidth,
      height / gridHeight
    );
  }

  const BLOCKED = "black";
  const CLOSED = "#115";
  const OPEN = "#511";
  const UNEXPLORED = "#222";

  function search_iteration() {
    let current = openSet.pop();
    if (current == goal) {
      let curr = goal;
      do {
        change_color(curr, "#090");
        curr = cameFrom.get(curr);
      } while (curr != start && curr !== undefined);
      change_color(start, "#090");
      return true;
    }
    closedSet.add(current);
    change_color(current, CLOSED);
    for (var di of [-1, 0, 1]) {
      for (var dj of [-1, 0, 1]) {
        //if(di + dj == 0 || di == dj) continue; // A* doesn't work very well with manhattan metric apparently?
        let neighbor = point(y(current) + di, x(current) + dj);
        if (!valid(neighbor) || neighbor == current) continue;
        if (closedSet.has(neighbor)) continue; // Ignore already evaluated neighbors.
        let tentative_gScore =
          get(gScore, current) + dist_between(current, neighbor); // The distance from start to a neighbor
        if (!openSet.has(neighbor)) {
          // Discover a new node
          openSet.push(neighbor);
          change_color(neighbor, OPEN);
        }
        if (tentative_gScore < get(gScore, neighbor)) {
          // This is a first known or better path, record it.
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentative_gScore);
          fScore.set(
            neighbor,
            get(gScore, neighbor) + heuristic_cost_est(neighbor, goal)
          );
        }
      }
    }
    if (openSet.size() == 0) {
      return true;
    }
  }

  function frame_iteration() {
    for (var i = 0; i < 1; i++) {
      if (search_iteration()) {
        setTimeout(reset, 3000);
        break;
      } else {
        window.requestAnimationFrame(frame_iteration);
      }
    }
  }

  function reset() {
    randomize_grid();
    init_search();
    init_draw();
    window.requestAnimationFrame(frame_iteration);
  }
  reset();

  return {
    onclicktouch: function (x, y) {
      // TODO
    },
  };
};
