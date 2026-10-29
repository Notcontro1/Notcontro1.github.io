/* DOM-independent physics model. Matter.js is vendored at version 0.20.0. */
class PortfolioPhysics {
  constructor(Matter, width, height) {
    this.M = Matter;
    this.engine = Matter.Engine.create({ enableSleeping: true });
    this.engine.gravity.y = 1.05;
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 8;
    this.engine.constraintIterations = 4;
    this.bodies = [];
    this.walls = [];
    this.drag = null;
    this.resize(width, height);
  }

  resize(width, height) {
    const { Bodies, Body, Composite, Sleeping } = this.M;
    this.width = Math.max(240, width);
    this.height = Math.max(200, height);
    this.walls.forEach(wall => Composite.remove(this.engine.world, wall));
    const wallHeight = Math.max(4000, this.height * 6);
    const options = { isStatic: true, friction: .8, restitution: .15 };
    this.walls = [
      Bodies.rectangle(this.width / 2, this.height + 20, this.width + 240, 60, options),
      Bodies.rectangle(-40, this.height - wallHeight / 2, 80, wallHeight, options),
      Bodies.rectangle(this.width + 40, this.height - wallHeight / 2, 80, wallHeight, options)
    ];
    Composite.add(this.engine.world, this.walls);
    this.bodies.forEach(body => {
      const ratio = Math.min(1, (this.width - 36) / body.portfolioSize.width);
      if (ratio < 1) {
        Body.scale(body, ratio, ratio);
        body.portfolioSize.width *= ratio;
        body.portfolioSize.height *= ratio;
        body.portfolioSize.scale *= ratio;
      }
      const dx = body.bounds.min.x < 2 ? 2 - body.bounds.min.x : body.bounds.max.x > this.width - 2 ? this.width - 2 - body.bounds.max.x : 0;
      const dy = body.bounds.max.y > this.height - 10 ? this.height - 10 - body.bounds.max.y : 0;
      if (dx || dy) Body.translate(body, { x: dx, y: dy });
      Sleeping.set(body, false);
    });
    this.endDrag();
  }

  addPiece({ x, y, width, height, angle = 0, scale = 1, velocityX = 0, spin = 0 }) {
    const { Bodies, Body, Composite } = this.M;
    const body = Bodies.rectangle(x, y, width, height, {
      angle, restitution: .28, friction: .6, frictionStatic: .8,
      frictionAir: .012, density: .001, sleepThreshold: 70,
      chamfer: { radius: Math.min(7, width / 6, height / 6) }
    });
    body.portfolioSize = { width, height, scale };
    Body.setVelocity(body, { x: velocityX, y: 0 });
    Body.setAngularVelocity(body, spin);
    this.bodies.push(body);
    Composite.add(this.engine.world, body);
    return body;
  }

  step() {
    this.M.Engine.update(this.engine, 1000 / 60);
  }

  isMoving() {
    return !!this.drag || this.bodies.some(body => !body.isSleeping);
  }

  beginDrag(point, direct = false) {
    this.endDrag();
    const { Query, Constraint, Composite, Sleeping } = this.M;
    const body = Query.point([...this.bodies].reverse(), point)[0];
    if (!body) return null;
    const offset = { x: point.x - body.position.x, y: point.y - body.position.y };
    Sleeping.set(body, false);
    const constraint = direct ? null : Constraint.create({
      pointA: { x: point.x, y: point.y }, bodyB: body, pointB: offset,
      length: 0, stiffness: .24, damping: .12, angularStiffness: 0
    });
    if (constraint) Composite.add(this.engine.world, constraint);
    this.drag = { body, constraint, offset, direct };
    this.bodies.splice(this.bodies.indexOf(body), 1);
    this.bodies.push(body);
    return body;
  }

  moveDrag(point) {
    if (!this.drag) return;
    const { body, constraint, offset, direct } = this.drag;
    this.M.Sleeping.set(body, false);
    if (direct) {
      this.M.Body.setPosition(body, { x: point.x - offset.x, y: point.y - offset.y });
      this.M.Body.setVelocity(body, { x: 0, y: 0 });
      this.M.Body.setAngularVelocity(body, 0);
    } else {
      constraint.pointA.x = point.x;
      constraint.pointA.y = point.y;
    }
  }

  endDrag() {
    if (!this.drag) return;
    if (this.drag.constraint) this.M.Composite.remove(this.engine.world, this.drag.constraint);
    this.drag = null;
  }

  nudge() {
    const { Body, Sleeping } = this.M;
    this.bodies.forEach((body, index) => {
      Sleeping.set(body, false);
      Body.setVelocity(body, { x: (Math.random() - .5) * 7, y: -5 - Math.random() * 5 });
      Body.setAngularVelocity(body, (index % 2 ? 1 : -1) * (.02 + Math.random() * .035));
    });
  }

  settle(maxSteps = 480) {
    for (let i = 0; i < maxSteps && this.isMoving(); i++) this.step();
    this.bodies.forEach(body => {
      this.M.Body.setVelocity(body, { x: 0, y: 0 });
      this.M.Body.setAngularVelocity(body, 0);
      this.M.Sleeping.set(body, true);
    });
  }

  dispose() {
    this.endDrag();
    this.M.Composite.clear(this.engine.world, false);
    this.M.Engine.clear(this.engine);
    this.bodies = [];
    this.walls = [];
  }
}

if (typeof module === 'object' && module.exports) module.exports = PortfolioPhysics;
else window.PortfolioPhysics = PortfolioPhysics;
