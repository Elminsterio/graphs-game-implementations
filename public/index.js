import { astar, Graph } from './astar.js';

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const map = [
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', '-', '-', ' ', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', '-', '-', ' ', ' ', ' ', ' ', '-', '-', '-', ' ', '-'],
    ['-', ' ', ' ', '-', ' ', ' ', '-', '-', ' ', ' ', ' ', ' ', ' ', '-'],
    ['-', '-', ' ', ' ', ' ', '-', '-', '-', ' ', '-', ' ', '-', ' ', '-'],
    ['-', '-', ' ', '-', ' ', '-', '-', '-', ' ', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', ' ', '-', ' ', ' ', '-', '-', ' ', '-', ' ', '-', ' ', '-'],
    ['-', ' ', '-', '-', '-', ' ', ' ', ' ', ' ', '-', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', '-', '-', ' ', ' ', ' ', ' ', 'p', '-'],
    ['-', '-', '-', '-', '-', '-' ,'-', '-', '-', '-', '-', '-', '-' ,'-']
]

class Boundary {

  static width = 40;
  static height = 40;

  constructor({ position }) {
      this.position = position;
      this.width = 40;
      this.height = 40;
  }

  draw() {
      c.fillStyle = 'blue'
      c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

}

class Ghost {
  static speed = 2;
  constructor({ position, velocity, color = 'red' }) {
      this.position = position;
      this.radius = 16;
      this.velocity = velocity;
      this.color = color;
      this.speed = 2;
      this.scared = false;
      this.prevCollisions = [];
  }

  draw() {
      c.beginPath();
      c.arc(this.position.x, this.position.y, this.radius, 2 * Math.PI, false);
      c.fillStyle = this.scared ? 'blue' : this.color;
      c.fill();
      c.stroke();
  }

  update() {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      this.draw();
  }

}

class PowerUp {
  constructor({ position }) {
      this.position = position;
      this.radius = 10;
      this.color = 'white';
  }

  draw() {
      c.beginPath();
      c.arc(this.position.x, this.position.y, this.radius, 2 * Math.PI, false);
      c.fillStyle = this.color;
      c.fill();
      c.stroke();
  }

}

const boundaries = [];
const powerUps = [];
const ghost = new Ghost({
  position: {
    x: Boundary.width * 1 + Boundary.width / 2,
    y: Boundary.height * 1 + Boundary.height / 2
  },
  velocity: {
    x: 0,
    y: 0
  },
  color: 'pink'
})

// Astar part

let mapParsed = map.map((row, indexRow) => {
    return row.map((col, indexCol) => {
        if(col === ' ') return 1;
        if(col === '-') return 0;
        if(col === 'p') return 1;
    })
})

let aStarGraph = new Graph(mapParsed);

let result = astar.search(aStarGraph, aStarGraph.grid[1][1], aStarGraph.grid[8][12]);
let positions = result.map((el, i) => {
    return {x: el.y, y: el.x}
})

map.forEach((row, indexRow) => {
  row.forEach((symbol, indexSymbol) => {
      switch(symbol) {
          case '-':
              boundaries.push(new Boundary({
                  position: {
                      x: Boundary.width * indexSymbol,
                      y: Boundary.height * indexRow
                      }
                  })
              ); 
              break;
          case 'p':
              powerUps.push(new PowerUp({
                  position: {
                      x: Boundary.width * indexSymbol + Boundary.width / 2,
                      y: Boundary.height * indexRow + Boundary.height / 2
                      }
                  }))
      }
  })
})


let animationID;
let nextPosition;

function animate() {
  animationID = requestAnimationFrame(animate);
  c.clearRect(0,0,canvas.width,canvas.height);

  boundaries.forEach((boundary) => {
    boundary.draw();
  })

  for(let i = powerUps.length - 1; i >= 0; i--){
    const powerUp = powerUps[i];
    powerUp.draw();

    if(Math.hypot(ghost.position.x - powerUp.position.x, ghost.position.y - powerUp.position.y) <
       ghost.radius + powerUp.radius) {
            powerUps.splice(i, 1);
    }
  }


  nextPosition = positions[0];

  if(Boundary.height * nextPosition.y + Boundary.height / 2 === ghost.position.y &&
     Boundary.width * nextPosition.x + Boundary.width / 2 === ghost.position.x) {
      positions.splice(0, 1);

      if(positions.length !== 0) {
        nextPosition = positions[0];
      } else {
        positions = generatePowerUp(nextPosition);
        nextPosition = positions[0];
        }
    }
  
  ghost.velocity.x = 0;
  ghost.velocity.y = 0;

  if(ghost.position.y < Boundary.height * nextPosition.y + Boundary.height / 2) ghost.velocity.y = 2;
  if(ghost.position.y > Boundary.height * nextPosition.y + Boundary.height / 2) ghost.velocity.y = -2;
  if(ghost.position.x < Boundary.width * nextPosition.x + Boundary.width / 2) ghost.velocity.x = 2;
  if(ghost.position.x > Boundary.width * nextPosition.x + Boundary.width / 2) ghost.velocity.x = -2;

  ghost.update();

} 

animate();

let lastPosition = 5;

function generatePowerUp(nextPosition) {

    let locations = [[1, 1], [5, 1], [8, 1], [12, 1], [12, 8], [8, 8], [1, 8]];
    let newLocation = Math.floor(Math.random() * locations.length);

    while(newLocation === lastPosition) {
        newLocation = Math.floor(Math.random() * locations.length);
    }


    lastPosition = newLocation;

    let location = locations[newLocation];

    powerUps.push(new PowerUp({
        position: {
            x: Boundary.width * location[0] + Boundary.width / 2,
            y: Boundary.height * location[1] + Boundary.height / 2
        }
    }))
    
    aStarGraph = new Graph(mapParsed);

    result = astar.search(aStarGraph, aStarGraph.grid[nextPosition.y][nextPosition.x], aStarGraph.grid[location[1]][location[0]]);

    return result.map((el, i) => {
        return {x: el.y, y: el.x}
    })
}
