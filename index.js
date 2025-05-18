// index.js
let branches = [];

function setup() {
  let canvas = createCanvas(600, 400);
  canvas.parent('canvas-container');
  angleMode(DEGREES);
  noFill();

  for (let i = 0; i < 20; i++) {
    let start = createVector(random(width), random(height));
    let dir = p5.Vector.fromAngle(random(-PI / 2, PI / 2));
    branches.push(new Branch(start, dir, random(40, 70), 0));
  }
}

function draw() {
  background(255);
  let t = frameCount * 0.01;

  // Dynamischere Windstärke
  let windStrength = map(noise(t), 0, 1, -0.6, 0.6);
  windStrength += sin(t * 2.5) * 0.8; // Stärkere Böen
  let wind = createVector(windStrength, 0);

  for (let b of branches) {
    b.applyWind(wind);
    b.update();
    b.display();
  }
}

class Branch {
  constructor(origin, dir, length, depth) {
    this.origin = origin;
    this.dir = dir;
    this.length = length;
    this.depth = depth;

    this.k = map(depth, 0, 5, 0.25, 0.05);
    this.node = new LeafNode(
      origin.x + dir.x * length,
      origin.y + dir.y * length,
      this.k
    );

    this.children = [];
    if (depth < 4) {
      let splits = floor(random(1, 3));
      for (let i = 0; i < splits; i++) {
        let newDir = dir.copy().rotate(random(-30, 30));
        let newLen = length * random(0.6, 0.8);
        this.children.push(
          new Branch(this.node.origin.copy(), newDir, newLen, depth + 1)
        );
      }
    } else {
      this.leaf = true;
    }
  }

  applyWind(force) {
    this.node.applyWind(force);
    for (let c of this.children) c.applyWind(force);
  }

  update() {
    this.node.update();
    for (let c of this.children) c.update();
  }

  display() {
    stroke(0);
    strokeWeight(map(this.depth, 0, 4, 2, 0.5));
    line(this.origin.x, this.origin.y, this.node.pos.x, this.node.pos.y);

    for (let c of this.children) c.display();
    if (this.leaf) this.node.displayLineLeaf();
  }
}

class LeafNode {
  constructor(x, y, k) {
    this.origin = createVector(x, y);
    this.pos = this.origin.copy();
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.k = k;
    this.damping = 0.9;
  }

  applyWind(force) {
    this.acc.add(force);
  }

  update() {
    let spring = p5.Vector.sub(this.origin, this.pos);
    spring.mult(this.k);
    this.acc.add(spring);
    this.vel.add(this.acc);
    this.vel.mult(this.damping);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  displayLineLeaf() {
    stroke(0);
    strokeWeight(0.7);
    let dir = p5.Vector.sub(this.pos, this.origin).normalize().mult(8);
    line(this.pos.x, this.pos.y, this.pos.x + dir.x, this.pos.y + dir.y);
  }
}

// sketch2.js
let strauchSketch = function(p) {
  let branches = [];
  let windTime = 0;

  p.setup = function() {
    let canvas = p.createCanvas(600, 400);
    canvas.parent('sketch2');

    // Dichtere Verteilung der Ausgangspunkte
    for (let x = 10; x < p.width; x += 20) { // Mehr Startpunkte
      createBranch(x, p.height, -90, p.random(50, 80)); // Längere Hauptäste
    }
  };

  function createBranch(x, y, angle, length) {
    if (length < 10) return; // Kleinere Endverzweigungen

    let branch = {
      start: p.createVector(x, y),
      angle: angle + p.random(-15, 15),
      length: length,
      thickness: p.map(length, 50, 8, 2, 0.3)
    };

    branches.push(branch);

    // Mehr Verzweigungen für dichteres Aussehen
    let branchCount = p.floor(p.random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      let newX = x + p.cos(p.radians(branch.angle)) * length;
      let newY = y + p.sin(p.radians(branch.angle)) * length;
      let newAngle = branch.angle + p.random(-40, 40);
      createBranch(newX, newY, newAngle, length * p.random(0.6, 0.85));
    }
  }

  p.draw = function() {
    p.background(255); // Weißer Hintergrund
    windTime += 0.02; // Schnellere Windänderung

    // Zoom und Verschiebung
    p.translate(-100, -50); // Verschiebe den Bildausschnitt
    p.scale(1.5); // Zoom (1.5x näher)

    branches.forEach(branch => {
      // Verstärkte und unregelmäßigere Windsimulation
      let baseWind = p.noise(windTime + branch.start.y * 0.02) * 60; // Stärkere Grundbewegung
      let gustEffect = p.sin(windTime * 4) * p.noise(windTime * 6) * 50; // Intensivere Böen
      let randomEffect = p.random(-10, 10); // Zufällige Unregelmäßigkeit
      let heightEffect = p.map(branch.start.y, p.height, 0, 0.5, 2); // Stärkere Höhenabhängigkeit

      let windAngle = branch.angle + (baseWind + gustEffect + randomEffect) * heightEffect;

      let endX = branch.start.x + p.cos(p.radians(windAngle)) * branch.length;
      let endY = branch.start.y + p.sin(p.radians(windAngle)) * branch.length;

      p.stroke(0);
      p.strokeWeight(branch.thickness);
      p.line(branch.start.x, branch.start.y, endX, endY);
    });
  };
};

new p5(strauchSketch);

let sketch3 = function(p) {
  let particles = [];
  let springs = [];
  let windTime = 0;

  p.setup = function() {
    let canvas = p.createCanvas(600, 400);
    canvas.parent('sketch3');

    // Erstelle mehrere Sträucher
    for (let x = 50; x < p.width; x += 50) { // Dichtere Verteilung der Sträucher
      createBush(x, p.height - 50, 8); // 8 Äste pro Strauch
    }
  };

  function createBush(baseX, baseY, branchCount) {
    let base = new Particle(baseX, baseY, true); // Fixierter Punkt am Boden
    particles.push(base);

    for (let i = 0; i < branchCount; i++) {
      let angle = p.random(-45, 45); // Zufälliger Winkel für die Äste
      let length = p.random(40, 70); // Kürzere Äste für mehr Punkte
      let endX = baseX + p.cos(p.radians(angle)) * length;
      let endY = baseY - p.sin(p.radians(angle)) * length;

      let branch = new Particle(endX, endY);
      particles.push(branch);

      let spring = new Spring(base, branch, length);
      springs.push(spring);

      // Verzweigungen für jeden Ast
      createBranch(branch, 4, length * 0.6); // 4 Verzweigungen pro Ast
    }
  }

  function createBranch(parent, depth, length) {
    if (depth <= 0) return;

    let angle = p.random(-30, 30); // Zufälliger Winkel für Verzweigungen
    let endX = parent.pos.x + p.cos(p.radians(angle)) * length;
    let endY = parent.pos.y - p.sin(p.radians(angle)) * length;

    let child = new Particle(endX, endY);
    particles.push(child);

    let spring = new Spring(parent, child, length);
    springs.push(spring);

    createBranch(child, depth - 1, length * 0.7); // Rekursive Verzweigungen
  }

  p.draw = function() {
    p.background(255);
    windTime += 0.02;

    // Dynamische Windkraft berechnen
    let wind = p.createVector(p.sin(windTime) * 2, 0); // Wind in X-Richtung
    wind.add(p.createVector(p.noise(windTime) * 2 - 1, 0)); // Unregelmäßige Böen

    // Kräfte auf Partikel anwenden
    for (let particle of particles) {
      if (!particle.anchored) {
        particle.applyForce(wind);
        particle.applyForce(p.createVector(0, 0.1)); // Schwerkraft
        particle.update();
      }
    }

    // Federn aktualisieren
    for (let spring of springs) {
      spring.update();
    }

    // Partikel zeichnen
    for (let particle of particles) {
      particle.display();
    }
  };

  // Partikel-Klasse
  class Particle {
    constructor(x, y, anchored = false) {
      this.pos = p.createVector(x, y);
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.anchored = anchored;
    }

    applyForce(force) {
      if (!this.anchored) {
        this.acc.add(force);
      }
    }

    update() {
      this.vel.add(this.acc);
      this.vel.mult(0.98); // Dämpfung
      this.pos.add(this.vel);
      this.acc.mult(0);
    }

    display() {
      p.stroke(0);
      p.strokeWeight(3); // Kleinere Punkte für mehr Abstraktion
      p.point(this.pos.x, this.pos.y);
    }
  }

  // Feder-Klasse
  class Spring {
    constructor(p1, p2, len) {
      this.p1 = p1;
      this.p2 = p2;
      this.len = len;
      this.k = 0.2; // Stärkere Federkonstante für stabilere Bewegung
    }

    update() {
      let force = p5.Vector.sub(this.p2.pos, this.p1.pos);
      let currentLen = force.mag();
      let stretch = currentLen - this.len;

      force.normalize();
      force.mult(-1 * this.k * stretch);

      this.p1.applyForce(force);
      this.p2.applyForce(force.mult(-1));
    }
  }
};

new p5(sketch3);

// sketch4.js (Slider-Sketch)
let sketch4 = function(p) {
  let branches = [];
  let windTime = 0;

  // Parameter mit Defaults
  let baseLength = 60;
  let angleRange = 40;
  let density = 20;

  // Slider-Elemente
  let lengthSlider, angleSlider, densitySlider;
 // let resetButton;

  p.setup = function() {
    let canvas = p.createCanvas(600, 400);
    canvas.parent("sketch4");

    // Sliders holen
    lengthSlider = p.select("#sliderLength");
    angleSlider = p.select("#sliderAngle");
    densitySlider = p.select("#sliderDensity");
    resetButton = p.select("#resetButton");

    // Anzeige der Werte aktualisieren
    updateParameterDisplays();

    // Events registrieren
    lengthSlider.input(() => {
      updateParameterDisplays();
      generateBranches();
    });

    angleSlider.input(() => {
      updateParameterDisplays();
      generateBranches();
    });

    densitySlider.input(() => {
      updateParameterDisplays();
      generateBranches();
    });

  //  resetButton.mousePressed(() => {
  //    generateBranches();
  //  });

    generateBranches();
  };

  function updateParameterDisplays() {
    baseLength = parseFloat(lengthSlider.value());
    angleRange = parseFloat(angleSlider.value());
    density = parseFloat(densitySlider.value());

    p.select("#lengthValue").html(baseLength);
    p.select("#angleValue").html(angleRange);
    p.select("#densityValue").html(density);
  }

  function generateBranches() {
    branches = [];
    for (let x = 10; x < p.width; x += density) {
      createBranch(x, p.height, -90, baseLength);
    }
  }

  function createBranch(x, y, angle, length) {
    if (length < 10) return;

    let branch = {
      start: p.createVector(x, y),
      angle: angle + p.random(-angleRange / 2, angleRange / 2),
      length: length,
      thickness: p.map(length, 50, 8, 2, 0.3)
    };

    branches.push(branch);

    let branchCount = p.floor(p.random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      let newX = x + p.cos(p.radians(branch.angle)) * length;
      let newY = y + p.sin(p.radians(branch.angle)) * length;
      let newAngle = branch.angle + p.random(-angleRange, angleRange);
      createBranch(newX, newY, newAngle, length * p.random(0.6, 0.85));
    }
  }

  p.draw = function() {
    p.background(255);
    windTime += 0.02;

    // Wind-Effekte
    p.translate(-100, -50); // Gleicher Bildausschnitt wie Sketch 2
    p.scale(1.5);


    for (let branch of branches) {
      let baseWind = p.noise(windTime + branch.start.y * 0.02) * 60;
      let gustEffect = p.sin(windTime * 4) * p.noise(windTime * 6) * 50;
      let randomEffect = p.random(-10, 10);
      let heightEffect = p.map(branch.start.y, p.height, 0, 0.5, 2);
      let windAngle = branch.angle + (baseWind + gustEffect + randomEffect) * heightEffect;

      let endX = branch.start.x + p.cos(p.radians(windAngle)) * branch.length;
      let endY = branch.start.y + p.sin(p.radians(windAngle)) * branch.length;

      p.stroke(0);
      p.strokeWeight(branch.thickness);
      p.line(branch.start.x, branch.start.y, endX, endY);
    }
  };
};

new p5(sketch4);

// ========== Sketch 5.1: Dicke → Helligkeit ==========
let colorSketch1 = function(p) {
  let branches = [];

  p.setup = function() {
    let c = p.createCanvas(190, 140);
    c.parent("colorSketch1");
    branches = [];
    for (let x = 10; x < p.width; x += 20) {
      createBranch(x, p.height, -90, p.random(50, 80));
    }
  };

  function createBranch(x, y, angle, length) {
    if (length < 10) return;
    let branch = {
      start: p.createVector(x, y),
      angle: angle + p.random(-15, 15),
      length: length,
      thickness: p.map(length, 50, 8, 2, 0.3)
    };
    branches.push(branch);

    let branchCount = p.floor(p.random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      let newX = x + p.cos(p.radians(branch.angle)) * length;
      let newY = y + p.sin(p.radians(branch.angle)) * length;
      let newAngle = branch.angle + p.random(-40, 40);
      createBranch(newX, newY, newAngle, length * p.random(0.6, 0.85));
    }
  }

  p.draw = function() {
    p.background(255);
    p.push();
    p.translate(-100, -10); // Gleicher Bildausschnitt wie Sketch 2
    p.scale(1.3);
    for (let branch of branches) {
      // Extremere Helligkeit: von 5% bis 95%
      let brightness = p.map(branch.thickness, 2, 0.3, 5, 95);
      p.stroke(`hsl(30, 60%, ${brightness}%)`);
      p.strokeWeight(branch.thickness * 1.3);
      let endX = branch.start.x + p.cos(p.radians(branch.angle)) * branch.length;
      let endY = branch.start.y + p.sin(p.radians(branch.angle)) * branch.length;
      p.line(branch.start.x, branch.start.y, endX, endY);
    }
    p.pop();
  };
};
new p5(colorSketch1);

// ========== Sketch 5.2: Höhe → Graustufen ==========
let colorSketch2 = function(p) {
  let branches = [];

  p.setup = function() {
    let c = p.createCanvas(190, 140);
    c.parent("colorSketch2");
    branches = [];
    for (let x = 10; x < p.width; x += 20) {
      createBranch(x, p.height, -90, p.random(50, 80));
    }
  };

  function createBranch(x, y, angle, length) {
    if (length < 10) return;
    let yNorm = p.map(y, p.height, 0, 0, 1);
    let branch = {
      start: p.createVector(x, y),
      angle: angle + p.random(-15, 15),
      length: length,
      thickness: p.map(length, 50, 8, 2, 0.3),
      yNorm: yNorm
    };
    branches.push(branch);

    let branchCount = p.floor(p.random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      let newX = x + p.cos(p.radians(branch.angle)) * length;
      let newY = y + p.sin(p.radians(branch.angle)) * length;
      let newAngle = branch.angle + p.random(-40, 40);
      createBranch(newX, newY, newAngle, length * p.random(0.6, 0.85));
    }
  }

  p.draw = function() {
    p.background(255);
    p.push();
    p.translate(-100, -10); // Gleicher Bildausschnitt wie Sketch 2
    p.scale(1.3);
    for (let branch of branches) {
      // Graustufen: oben hell (220), unten dunkel (30)
      let gray = p.lerp(220, 30, branch.yNorm);
      p.stroke(gray);
      p.strokeWeight(branch.thickness);
      let endX = branch.start.x + p.cos(p.radians(branch.angle)) * branch.length;
      let endY = branch.start.y + p.sin(p.radians(branch.angle)) * branch.length;
      p.line(branch.start.x, branch.start.y, endX, endY);
    }
    p.pop();
  };
};
new p5(colorSketch2);

// ========== Sketch 5.3: Tiefe → Sättigung ==========
let colorSketch3 = function(p) {
  let branches = [];

  p.setup = function() {
    let c = p.createCanvas(190, 140);
    c.parent("colorSketch3");
    p.colorMode(p.HSB, 360, 100, 100);
    branches = [];
    for (let x = 10; x < p.width; x += 20) {
      createBranch(x, p.height, -90, p.random(50, 80), 0);
    }
  };

  function createBranch(x, y, angle, length, depth) {
    if (length < 10) return;
    let branch = {
      start: p.createVector(x, y),
      angle: angle + p.random(-15, 15),
      length: length,
      thickness: p.map(length, 50, 8, 2, 0.3) * p.map(depth, 0, 5, 1.2, 0.5),
      depth: depth
    };
    branches.push(branch);

    let branchCount = p.floor(p.random(2, 5));
    for (let i = 0; i < branchCount; i++) {
      let newX = x + p.cos(p.radians(branch.angle)) * length;
      let newY = y + p.sin(p.radians(branch.angle)) * length;
      let newAngle = branch.angle + p.random(-40, 40);
      createBranch(newX, newY, newAngle, length * p.random(0.6, 0.85), depth + 1);
    }
  }

  p.draw = function() {
    p.background(0, 0, 100);
    p.push();
    p.translate(-100, -10); // Gleicher Bildausschnitt wie Sketch 2
    p.scale(1.3);
    for (let branch of branches) {
      // Sättigung noch deutlicher: von 100 (Stamm) bis 0 (Ende)
      let saturation = p.map(branch.depth, 0, 5, 100, 0, true);
      p.stroke(120, saturation, 30);
      p.strokeWeight(branch.thickness);
      let endX = branch.start.x + p.cos(p.radians(branch.angle)) * branch.length;
      let endY = branch.start.y + p.sin(p.radians(branch.angle)) * branch.length;
      p.line(branch.start.x, branch.start.y, endX, endY);
    }
    p.pop();
  };
};
new p5(colorSketch3);

// Beispiel für alle Mini-Sketches (nur Ausschnitt/Transformation gezeigt)
p.draw = function() {
  p.background(255); // oder p.background(0,0,100) bei HSB
  p.push();
  p.translate(-100, -20); // wie in Sketch 2
  p.scale(1.2);           // wie in Sketch 2
  for (let branch of branches) {
    // ... Farblogik und Zeichnen wie gehabt ...
  }
  p.pop();
};