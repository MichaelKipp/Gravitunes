/*
Author: Michael Kipp
Date: 3/22/2018
Project: Physics Music Maker
*/

/*
TODO: Grabbable pads
TODO: Tone indication
TODO: Drip tempo adjustment
*/

var TEMPO;
var GRAVITY;
var DRIP_RADIUS;
var PAD_THICKNESS;

var width;
var height;

var drippers;
var drops;
var pads;

var grabbing;
var grabbed;
var playing;
var dripperCreation;
var padCreation;

var initialClick;

function setup() {
  createCanvas(windowWidth, windowHeight);
  width = windowWidth;
  height = windowHeight;

  smooth();
  background(255);
  angleMode(RADIANS);
  collideDebug(true);

  TEMPO = 100;
  GRAVITY = 0.1;
  DRIP_RADIUS = 7;
  PAD_THICKNESS = 5;

  playing = true;
  initialClick = createVector(0, 0);
  grabbing = false;
  drippers = [];
  drops = [];
  pads = [];
}

function draw() {
  if (playing) {
    background(255);
    noFill();
    if (padCreation) {
      line(mouseX, mouseY, initialClick.x, initialClick.y);
      stroke(0, 0, 0);
    }
    for (var i = 0; i < drippers.length; i++) {
      drippers[i].hovered = false;
      if (drippers[i].collidesWith(mouseX, mouseY)) {
        drippers[i].hovered = true;
      }
      drippers[i].display();
      drippers[i].count++;
      if (drippers[i].count == TEMPO) {
        drippers[i].drip();
        drippers[i].count = 0;
      }
    }
    for (var d = 0; d < drops.length; d++) {
      for (var p = 0; p < pads.length; p++) {
        if (drops[d].collidesWith(pads[p])) {
          pad = pads[p];
          pad.play(pads[p].osc);
          drops[d].reflect(pads[p]);
          drops[d].hasUpdated = true;
        }
      }
      if (!drops[d].hasUpdated) {
        drops[d].update();
      }
      drops[d].display();
      drops[d].hasUpdated = false;
    }
    for (var i = drops.length - 1; i > -1; i--) {
      if (drops[i].offScreen()) {
        drops.splice(i, 1);
      }
    }
    for (var i = pads.length - 1; i > -1; i--) {
      pads[i].update();
      pads[i].display();
    }
  }
}

function Dripper(location, tempo) {
  this.location = location;
  this.tempo = tempo;
  this.count = 0;
  this.hovered = false;
  this.grabbed = false;
  this.poly = [createVector(this.location.x - 5, this.location.y - 2),
          createVector(this.location.x + 5, this.location.y - 2),
          createVector(this.location.x, this.location.y + 5)];

  this.generateCoordinates = function() {
    this.poly = [createVector(this.location.x - 5, this.location.y - 2),
            createVector(this.location.x + 5, this.location.y - 2),
            createVector(this.location.x, this.location.y + 5)];
  }

  this.update = function() {
    if (count == tempo) {
      drip(location);
    } else {
      count++;
    }
  };

  this.collidesWith = function(x, y) {
    return collidePointPoly(x, y, this.poly);
  };

  this.display = function() {
    if (this.hovered) {
      fill(255);
    } else {
      fill(0);
    }
    triangle(this.poly[0].x, this.poly[0].y, this.poly[1].x, this.poly[1].y, this.poly[2].x, this.poly[2].y);
  };

  this.drip = function () {
      drops.push(new Drop(createVector(this.location.x, this.location.y), createVector(0, 0), createVector(0, GRAVITY)));
      this.count = 0;
  }
}

function Drop(location, velocity, acceleration) {
  this.location = location;
  this.velocity = velocity;
  this.acceleration = acceleration;
  this.hasUpdated = false;

  this.update = function() {
    velocity.add(acceleration);
    location.add(velocity);
  };

  this.reflect = function(pad) {
    normal = createVector(-(pad.end.y - pad.start.y), (pad.end.x - pad.start.x));
    projection = normal.normalize().mult((p5.Vector.dot(velocity, normal))/(p5.Vector.dot(normal, normal)));
    velocity = velocity.sub(projection.mult(2));
    velocity.add(acceleration);
    location.add(velocity);
  };

  this.display = function() {
    stroke(0);
    fill(175);
    ellipse(location.x,location.y, DRIP_RADIUS, DRIP_RADIUS);
  };

  this.collidesWith = function(pad) {
    return collideLineCircle(pad.start.x, pad.start.y, pad.end.x, pad.end.y, this.location.x, this.location.y, DRIP_RADIUS);
  }

  this.offScreen = function() {
    if (location.x > width || location.x < 0 || location.y > height || location.y < 0) {
      return true;
    } else {
      return false;
    }
  };
}

function Pad(start, end) {
  var osc;
  this.start = start;
  this.end = end;
  this.length = int(dist(start.x, start.y, end.x, end.y));
  this.osc = new p5.Oscillator();
  this.osc.setType('sine');
  this.osc.freq(this.length * 4);
  this.osc.amp(0);
  this.osc.start();

  this.play = function(osc) {
    playStart = frameCount;
    osc.amp(1, 0.001);
    setTimeout(function() {
      osc.amp(0, 0.001);
    }, (.1 * 1000))
  }

  this.update = function() {
  }

  this.display = function() {
    stroke(30, 30, 30);
    line(start.x, start.y, end.x, end.y);
  }
}

function mousePressed() {
  if (mousePressed && (mouseButton == LEFT)) {
    for (var i = 0; i < drippers.length; i++) {
      drippers[i].grabbed = false;
      if (drippers[i].collidesWith(mouseX, mouseY)) {
        drippers[i].grabbed = true;
        grabbing = true;
        grabbed = drippers[i];
        console.log("Grabbed" + grabbed);
      }
    }
    if (!grabbing) {
      dripperCreation = 1;
      initialClick = createVector(mouseX, mouseY);
    }
  }
  if (mousePressed && (mouseButton == RIGHT)) {
    padCreation = 1;
    initialClick = createVector(mouseX, mouseY);
  }
}

function mouseReleased() {
  if (dripperCreation) {
    drippers.push(new Dripper(createVector(initialClick.x, initialClick.y), TEMPO));
    dripperCreation = 0;
  } else if (padCreation) {
    pads.push(new Pad(initialClick, createVector(mouseX, mouseY)));
    padCreation = 0;
  }
  if (grabbing) {
    grabbing = false;
    grabbed.grabbed = false;
  }
}

function mouseDragged() {
  if (padCreation) {
    dragRadius = dist(mouseX, mouseY, initialClick.x, initialClick.y);
  }
  if (grabbing) {
    grabbed.location = createVector(mouseX, mouseY);
    grabbed.generateCoordinates();
    console.log("Grabbind" + grabbed);
  }
}

function keyPressed() {
  if (keyCode == 32) {
    playing = !playing;
  }
  if (keyCode === 81) {
    console.log("Frame count" + frameCount);
    console.log("drippers " + drippers);
    console.log("drops " + drops);
    console.log("pads " + pads)
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
