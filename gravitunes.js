/*
Author: Michael Kipp
Date: 3/22/2018
Project: Physics Music Maker
*/

/*
TODO: Volume control
TODO: Show notes for pads
TODO: add pad bounce interaction animation
*/

var TEMPO;
var MAX_TEMPO;
var GRAVITY;
var DRIP_RADIUS;
var HANDLE_RADIUS;
var PAD_THICKNESS;
var DRIPPER_ADJUSTMENT_RADIUS;



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
var padStartVectorDistance;
var padEndVectorDistance;



function setup() {
  createCanvas(windowWidth, windowHeight);
  width = windowWidth;
  height = windowHeight;

  smooth();
  background(255);
  angleMode(RADIANS);
  collideDebug(true);

  TEMPO = 100;
  MAX_TEMPO = 1000;
  GRAVITY = 0.1;
  DRIP_RADIUS = 7;
  PAD_THICKNESS = 5;
  HANDLE_RADIUS = 10;
  DRIPPER_ADJUSTMENT_RADIUS = 50;

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
      drippers[i].toggle.knob.hovered = false;
      if (drippers[i].collidesWith(mouseX, mouseY)) {
        drippers[i].hovered = true;
      }
      if (drippers[i].toggle.knob.collidesWith(mouseX, mouseY)) {
        drippers[i].toggle.knob.hovered = true;
      }
      drippers[i].display();
      drippers[i].count++;
      if (drippers[i].count == drippers[i].tempo) {
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
      pads[i].resetHovered();

      if (pads[i].collidesWith(mouseX, mouseY)) {
        pads[i].hovered = true;
      }
      if (pads[i].startHandle.collidesWith(mouseX, mouseY)) {
        pads[i].hovered = true;
        pads[i].startHandle.hovered = true;
      }
      if (pads[i].endHandle.collidesWith(mouseX, mouseY)) {
        pads[i].hovered = true;
        pads[i].endHandle.hovered = true;
      }
      pads[i].update();
      pads[i].display();
    }
  }
}



function Dripper(location, tempo) {
  this.location = location;
  this.maxTempo = tempo;
  this.tempo = tempo;
  this.count = 0;
  this.hovered = false;
  this.grabbed = false;
  this.moved = false;
  this.poly = [createVector(this.location.x - 5, this.location.y - 2),
          createVector(this.location.x + 5, this.location.y - 2),
          createVector(this.location.x, this.location.y + 5)];
  this.toggle = new TempoToggle(this.location, .5, this);

  this.updateCoordinates = function() {
    this.poly = [createVector(this.location.x - 5, this.location.y - 2),
            createVector(this.location.x + 5, this.location.y - 2),
            createVector(this.location.x, this.location.y + 5)];
    this.toggle.update(this.location);
  }

  this.update = function() {
    this.tempo = Math.ceil(this.maxTempo * this.toggle.percent) + 5;
    this.count = 0;
  };

  this.collidesWith = function(x, y) {
    return collidePointPoly(x, y, this.poly);
  };

  this.display = function() {
    if (this.hovered) {
      if (this.activated) {
        this.toggle.display();
        fill(255);
      }
    } else if (this.activated) {
      this.toggle.display();
      fill(255, 0, 0);
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



function TempoToggle(location, percent, parent) {
  this.location = location;
  this.percent = percent;
  this.parent = parent;
  this.knob = new ToggleKnob(this.location, this.percent, this);

  this.update = function(newLocation) {
    this.location = newLocation;
    this.knob.update(newLocation);
  }

  this.display = function() {
    arc(this.location.x,this.location.y, 80, 80, TWO_PI * .4, TWO_PI * .1);
    this.knob.display();
  }
}

function ToggleKnob(location, percent, parent) {
  this.location = location;
  this.percent = percent;
  this.parent = parent;
  this.hovered = false;
  this.grabbed = false;

  this.collidesWith = function(x, y) {
    return collidePointCircle(x, y, 40 * cos(TWO_PI * .4 + ((this.percent) * (TWO_PI * .7))) + this.location.x,
              40 * sin(TWO_PI * .4 + ((this.percent) * (TWO_PI * .7))) + this.location.y, 10);
  };

  this.update = function(newLocation) {
    if (this.grabbed) {
      if (this.percent > 0 && this.percent < 1) {
        this.percent +=  TWO_PI * .001 * newLocation;
      }
      if (this.percent <= 0) {
        this.percent = 0.0001;
      }
      if (this.percent >= 1) {
        this.percent = 0.999;
      }
      parent.percent = this.percent;
    } else {
      this.location = newLocation;
    }
  }

  this.display = function() {
    fill(200, 200, 200);
    if (this.hovered) {
      fill(255, 255, 255);
    }
    if (this.grabbed) {
      fill(255, 0, 0);
    }
    ellipse(40 * cos(TWO_PI * .4 + ((this.percent) * (TWO_PI * .7))) + this.location.x,
              40 * sin(TWO_PI * .4 + ((this.percent) * (TWO_PI * .7))) + this.location.y, 10, 10);
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
    location.add(velocity.mult(1.02));
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
  this.hovered = false;
  this.grabbed = false;
  this.activated = false;
  this.length = int(dist(start.x, start.y, end.x, end.y));
  this.osc = new p5.Oscillator();
  this.osc.setType('sine');
  this.osc.freq(this.length * 4);
  this.osc.amp(0);
  this.osc.start();
  this.startHandle = new Handle(this, start);
  this.startHandle.isStartHandle = true;
  this.endHandle = new Handle(this, end);

  this.play = function(osc) {
    playStart = frameCount;
    osc.amp(1, 0.001);
    setTimeout(function() {
      osc.amp(0, 0.001);
    }, (.1 * 1000))
  }

  this.resetHovered = function() {
    this.hovered = false;
    this.startHandle.hovered = false;
    this.endHandle.hovered = false;
  }

  this.resetGrabbed = function() {
    this.grabbed = false;
    this.startHandle.grabbed = false;
    this.endHandle.grabbed = false;
  }

  this.collidesWith = function(x, y) {
    return collidePointLine(x, y, this.start.x, this.start.y, this.end.x, this.end.y, 1.5);
  };

  this.updateCoordinates = function(newStart, newEnd) {
    this.start = newStart;
    this.end = newEnd;
    this.startHandle.updateCoordinates(this.start);
    this.endHandle.updateCoordinates(this.end);
    this.length = int(dist(this.start.x, this.start.y, this.end.x, this.end.y));
    this.osc.freq(this.length * 4);
  }

  this.update = function() {
  }

  this.display = function() {
    if (this.startHandle.hovered) {
      stroke(50);
      this.startHandle.display();
    } else if (this.endHandle.hovered) {
      stroke(50);
      this.endHandle.display();
    } else if (this.hovered) {
      stroke(50);
    } else {
      stroke(150);
      this.startHandle.display();
      this.endHandle.display();
    }
    line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}



function Handle(pad, location) {
  this.hovered = false;
  this.grabbed = false;
  this.isStartHandle = false;
  this.location = location;
  this.pad = pad;

  this.collidesWith = function(x, y) {
    return collidePointCircle(x, y, this.location.x, this.location.y, HANDLE_RADIUS);
  };

  this.display = function() {
      ellipse(this.location.x, this.location.y, HANDLE_RADIUS, HANDLE_RADIUS);
  }
  this.updateCoordinates = function(newLocation) {
    this.location = newLocation;
  }
}



function mousePressed() {
  if (mousePressed && (mouseButton == LEFT)) {
    initialClick = createVector(mouseX, mouseY);
    for (var i = 0; i < drippers.length; i++) {
      drippers[i].grabbed = false;
      drippers[i].toggle.knob.grabbed = false;
      if (drippers[i].collidesWith(mouseX, mouseY)) {
        drippers[i].grabbed = true;
        grabbing = true;
        grabbed = drippers[i];
      }
      if (drippers[i].toggle.knob.collidesWith(mouseX, mouseY)) {
        drippers[i].toggle.knob.grabbed = true;
        grabbing = true;
        grabbed = drippers[i].toggle.knob;
      }
    }
    for (var i = 0; i < pads.length; i++) {
      pads[i].resetGrabbed();
      if (pads[i].startHandle.collidesWith(mouseX, mouseY)) {
        pads[i].startHandle.grabbed = true;
        grabbing = true;
        grabbed = pads[i].startHandle;
        padStartVectorDistance = createVector(mouseX - pads[i].startHandle.location.x, mouseY - pads[i].startHandle.location.y);
        padEndVectorDistance = createVector(pads[i].endHandle.location.x, pads[i].endHandle.location.y);
      } else if (pads[i].endHandle.collidesWith(mouseX, mouseY)) {
        pads[i].endHandle.grabbed = true;
        grabbing = true;
        grabbed = pads[i].endHandle;
        padStartVectorDistance = createVector(pads[i].startHandle.location.x, pads[i].startHandle.location.y);
        padEndVectorDistance = createVector(pads[i].endHandle.location.x - mouseX, pads[i].endHandle.location.y - mouseY);
      } else if (pads[i].collidesWith(mouseX, mouseY)) {
        pads[i].grabbed = true;
        grabbing = true;
        grabbed = pads[i];
        padStartVectorDistance = createVector(mouseX - pads[i].start.x, mouseY - pads[i].start.y);
        padEndVectorDistance = createVector(pads[i].end.x - mouseX, pads[i].end.y - mouseY);
      }
    }
    if (!grabbing) {
      dripperCreation = 1;
      initialClick = createVector(mouseX, mouseY);
    }
    console.log(grabbed);
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
    if (grabbed instanceof Dripper) {
      if (grabbed.moved) {
        grabbed.moved = false;
      } else {
        grabbed.activated = !grabbed.activated;
      }
    }
  }
}



function mouseDragged() {
  if (padCreation) {
    dragRadius = dist(mouseX, mouseY, initialClick.x, initialClick.y);
  }
  if (grabbing) {
    if (grabbed instanceof Dripper) {
      grabbed.moved = true;
      grabbed.location = createVector(mouseX, mouseY);
      grabbed.updateCoordinates();
    } else if (grabbed instanceof Pad) {
      grabbed.updateCoordinates(createVector(mouseX - padStartVectorDistance.x, mouseY - padStartVectorDistance.y),
                                              createVector(mouseX + padEndVectorDistance.x, mouseY + padEndVectorDistance.y));
    } else if (grabbed instanceof Handle) {
      if (grabbed.isStartHandle) {
        grabbed.pad.updateCoordinates(createVector(mouseX, mouseY), padEndVectorDistance);
      } else {
        grabbed.pad.updateCoordinates(padStartVectorDistance, createVector(mouseX, mouseY));
      }
    } else if (grabbed instanceof ToggleKnob) {
      grabbed.update(initialClick.y - mouseY);
      initialClick = createVector(mouseX, mouseY);
      grabbed.parent.parent.update();
    }
  }
}

function keyPressed() {
  if (keyCode == 32) {
    playing = !playing;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
