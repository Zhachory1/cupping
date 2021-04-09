var TWO_PI = 2 * Math.PI;
var FLAVOR_NAMES = [
    "industrial",
    "bitter",
    "musty",
    "vegetative",
    "sour",
    "citrus",
    "stone fruit",
    "dried fruit",
    "berry",
    "floral",
    "sweet",
    "chocolate",
    "nutty",
    "spice",
    "malty",
    "roasted",
    "smokey"
];
var NUM_PAGES = 3;
var PAGE_DATA = []
var FLAVOR_NUM = 17;
var FLAVOR_MAX_SCORE = 5;

function memoizer(fun){
    let cache = {}
    return function (n){
        if (cache[n] != undefined ) {
          return cache[n];
        } else {
          let result = fun(n);
          cache[n] = result;
          return result;
        }
    }
}

const sqrt = memoizer(Math.sqrt);
const sin = memoizer(Math.sin);
const sum_reducer = (accumulator, currentValue) => accumulator + currentValue;
const positive_reducer = (acc, value) => acc && (value >= 0);

function getXAndYFromAngle(centerX, centerY, radius, angle) {
    signY = 1;
    if (angle > Math.PI/2 && angle < 3*Math.PI/2) {
        signY = -1;
    }
    plusY = signY*sin(angle)*radius;
    plusX = sqrt(radius*radius-plusY*plusY);
    return [centerX+(signY*plusX), centerY+(signY*plusY)]
}

function newPointForCircle(centerX, centerY, radius, angle) {
    return new paper.Point(...getXAndYFromAngle(centerX, centerY, radius, angle));
}

/**
 * DEPRECATED - Use makePaperColorWheel
 * Make the clickable coffee flavor wheel
 *
 * params:
 *  id - real id of a canvas element
 *  colorArray - list of intensity values to color the wheel clockwise
 *      starting from industrial
 *
 * TODO
 *  - Figure out how to add space between pie pieces, use translate
 */
function makeColorWheel(id, colorArray) {
    var c = document.getElementById(id);
    c.width = 500;
    c.height = 500;
    if (c.getContext) {
        centerX = 250;
        centerY = 250;
        radiusInner = 30;
        radiusOuter = 220;
        var ctx = c.getContext("2d")
        ctx.strokeStyle = "white";
        for (var i = 0; i < FLAVOR_NUM; i++) {
            var ctx = c.getContext("2d");
            const slice = new Path2D();
            slice.arc(centerX, centerY, radiusOuter, i*TWO_PI/FLAVOR_NUM, (i+1)*TWO_PI/FLAVOR_NUM); // outer arc
            slice.lineTo(...getXAndYFromAngle(centerX, centerY, radiusInner, (i+1)*TWO_PI/FLAVOR_NUM)); // out to in line
            slice.arc(centerX, centerY, radiusInner, (i+1)*TWO_PI/FLAVOR_NUM, i*TWO_PI/FLAVOR_NUM, true); // inner arc
            slice.closePath();
            slice.flavor = FLAVOR_NAMES[i];
            ctx.fillStyle = "rgba(173, 216, 230, "+ colorArray[i] +")";
            ctx.fill(slice);
            ctx.stroke(slice);
            c.addEventListener("mousemove", function(event) {
                // Check whether point is inside circle
              if (ctx.isPointInPath(slice, event.offsetX, event.offsetY)) {
                ctx.fillStyle = 'green';
              }
              else {
                ctx.fillStyle = 'red';
              }

              // Draw circle
              ctx.fill(slice);
              ctx.stroke(slice);
            });
            c.addEventListener("mouseup", function(event) {
                // Check whether point is inside circle
              if (ctx.isPointInPath(slice, event.offsetX, event.offsetY)) {
                alert("This slice is flavor: " + slice.flavor);
              }
            });
        }
    }
}

class FlavorWheel {
    constructor(element_id, num_slices, scores) {
        this.element_id = element_id;
        this.num_slices = num_slices;
        this.scores = scores;
        this.flavor_strengths = this.createFSFromScores(this.scores)

        this.c = document.getElementById(element_id);
        // this.c.width = 100;
        // this.c.height = 100;

        paper.setup(this.c);
        this.project = paper.project;
        this.height = this.project.view.bounds.height;
        this.width = this.project.view.bounds.width;

        this.draw();
    }
    createFSFromScores(scores) {
        // Basic algorithm:
        // If all 0: set all to 0
        // Else:
        //   Copy scores into new array
        //   Sum all scores
        //   Divide all scores in new array with sum of scores
        //   Get max value of the new array
        //   Multiply all values by this max value
        // End result should be an array with a range of [0, 1]
        let all_positives = scores.reduce(positive_reducer, true);
        if (!all_positives) {
            console.log(scores);
            throw Error("Scores are not all positive");
        }
        let sum_scores = scores.reduce(sum_reducer);
        if (sum_scores == 0) {
            return Array(this.num_slices).fill(0);
        }

        // tmp_fs stands for temp flavor strengths
        let tmp_fs = [...scores].map(i => i/sum_scores)

        let max_fs = Math.max(...tmp_fs);
        return tmp_fs.map(i => i/max_fs);
    }

    /**
     * Make the clickable coffee flavor wheel with paper.js
     * TODO
     *  - Figure out how to add space between pie pieces, use translate
     *  - Add interactions with the slices
     *  - Initializations of circles that aren't initially shown are squashed
     */
    draw() {
        let centerX = this.width/2;
        let centerY = this.height/2;
        let radiusInner = 15;
        let radiusOuter = (Math.min(this.height, this.width)/2)-15;
        for (let i = 0; i < this.num_slices; i++) {
            let beginAngle = i*TWO_PI/this.num_slices;
            let endAngle = (i+1)*TWO_PI/this.num_slices;
            let middleAngle = (i+0.5)*TWO_PI/this.num_slices;
            let slice = new paper.Path();
            slice.fillColor = new paper.Color(173/255, 216/255, 230/255, this.flavor_strengths[i]);
            slice.strokeColor = "white";
            let first = newPointForCircle(centerX, centerY, radiusOuter, beginAngle);
            let second = newPointForCircle(centerX, centerY, radiusOuter, middleAngle);
            let third = newPointForCircle(centerX, centerY, radiusOuter, endAngle);
            let fourth = newPointForCircle(centerX, centerY, radiusInner, endAngle);
            let fifth = newPointForCircle(centerX, centerY, radiusInner, middleAngle);
            let sixth = newPointForCircle(centerX, centerY, radiusInner, beginAngle);
            slice.add(first)
            slice.arcTo(second,third)
            slice.lineTo(fourth)
            slice.arcTo(fifth, sixth)
            slice.closePath();
        }
        this.project.view.draw()
    }
}


randomCnt=1;
function randomPage(id) {
    let scores = Array.apply(null, new Array(FLAVOR_NUM)).map(function() {
      if (Math.random() > 0.5) {
        return Math.floor(Math.random()*(FLAVOR_MAX_SCORE+1))
      }
      return 0;
    });
    return {
        "coffee_name": "coffee_"+randomCnt++,
        "scores": scores,
        "flavor_wheel": new FlavorWheel(id, FLAVOR_NUM, scores)
    };
}

function main() {
    console.log("Starting main.js");

    // Init pages with data
    elementWithCanvas = ["coffee-1", "coffee-2", "coffee-3"];
    elementWithCanvas.forEach((id) =>
        PAGE_DATA.push(randomPage(id))
    );

    console.log("Ending main.js");
}

window.onload = function() {
    main();
}