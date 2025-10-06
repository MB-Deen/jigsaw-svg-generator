// JavaScript Document
// Jigsaw SVG Generator
// (c) 2024 by Michael F. Fury
// https://www.mbfury.com
// License: CC0 1.0 Universal (CC0 1.0) Public Domain Dedication
// https://creativecommons.org/publicdomain/zero/1.0/

// save function pieced together from here: https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
function save(filename, data) {
   var blob = new Blob([data], { type: "image/svg+xml" });
   if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
   }
   else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
   }
}

var seed = 1;
function random() { var x = Math.sin(seed) * 10000; seed += 1; return x - Math.floor(x); }
function uniform(min, max) { var r = random(); return min + r * (max - min); }
function rbool() { return random() > 0.5; }

function $(id) { return document.getElementById(id); }

function updateseed() { $("_seed").value = $("seed").value; update(); }
function updatetabsize() { $("_tabsize").value = $("tabsize").value + "%"; update(); }
function updatejitter() { $("_jitter").value = $("jitter").value + "%"; update(); }
function update_seed() { var val = parseFloat($("_seed").value); if (!isNaN(val)) { $("seed").value = val; } updateseed(); }
function update_tabsize() { var val = parseFloat($("_tabsize").value); if (!isNaN(val)) { $("tabsize").value = val; } updatetabsize(); }
function update_jitter() { var val = parseFloat($("_jitter").value); if (!isNaN(val)) { $("jitter").value = val; } updatejitter(); }

function next() { flip = rbool(); a = uniform(-j, j); b = uniform(-j, j); c = uniform(-j, j); d = uniform(-j, j); e = uniform(-j, j); }
function l(v) { return v; }
function w(v) { return v * (flip ? -1.0 : 1.0); }
function p0() { return { l: l(0.0), w: w(0.0), }; }
function p1() { return { l: l(0.2), w: w(a), }; }
function p2() { return { l: l(0.5 + b + d), w: w(-t + c), }; }
function p3() { return { l: l(0.5 - t + b), w: w(t + c), }; }
function p4() { return { l: l(0.5 - 2.0 * t + b - d), w: w(3.0 * t + c), }; }
function p5() { return { l: l(0.5 + 2.0 * t + b - d), w: w(3.0 * t + c), }; }
function p6() { return { l: l(0.5 + t + b), w: w(t + c), }; }
function p7() { return { l: l(0.5 + b + d), w: w(-t + c), }; }
function p8() { return { l: l(0.8), w: w(e), }; }
function p9() { return { l: l(1.0), w: w(0.0), }; }

function parse_input() {
   seed = parseInt($("seed").value);
   t = parseFloat($("tabsize").value) / 200.0;
   j = parseFloat($("jitter").value) / 100.0;
   n = parseInt($("rings").value);
   do_warp = $("warp").checked;
   do_trunc = $("trunc").checked;
}

function scale(x, y) {
   return {
      x: x * (1.0 / (2 * n - 4.0 / 3)) * radius,
      y: y * (1.0 / (2 * n - 4.0 / 3)) * radius * Math.sqrt(0.75),
   };
}

function rotate(vec, rot) {
   var cs = Math.cos(rot);
   var sn = Math.sin(rot);

   return {
      x: vec.x * cs - vec.y * sn,
      y: vec.x * sn + vec.y * cs,
   };
}

function warp(vec) {
   if (!do_warp) {
      return vec;
   }
   var angl = Math.atan2(vec.y, vec.x) + Math.PI;
   var angl60 = angl % (Math.PI / 3);
   var angl30 = Math.abs((Math.PI / 6) - angl60);
   var l = Math.sqrt(0.75) / Math.cos(angl30);
   return {
      x: vec.x / l,
      y: vec.y / l,
   };
}

function translate(vec) {
   return {
      x: vec.x + radius + offset,
      y: vec.y + radius + offset,
   };
}

function process_r(x, y, rot) {
   return translate(warp(rotate(scale(x, y), rot)));
}

function process(x, y) {
   return process_r(x, y, 0);
}

function sub(v1, v2) {
   return {
      x: v1.x - v2.x,
      y: v1.y - v2.y,
   };
}

function rot90(v) {
   return {
      x: -v.y,
      y: v.x,
   };
}

function add(v1, v2) {
   return {
      x: v1.x + v2.x,
      y: v1.y + v2.y,
   };
}

function mul(s, v) {
   return {
      x: s * v.x,
      y: s * v.y,
   };
}

function lerp(p, v1, v2, op) {
   dl = sub(v2, v1);
   dw = rot90(dl);
   var vec = add(v1, mul(p.l, dl));
   vec = add(vec, mul(p.w, dw));
   return op + vec.x + " " + vec.y + " ";
}

function gentab(v1, v2, isnew) {
   var str = "";
   next();
   if (isnew) {
      str += lerp(p0(), v1, v2, "M ");
   }
   str += lerp(p1(), v1, v2, "C ");
   str += lerp(p2(), v1, v2, "");
   str += lerp(p3(), v1, v2, "");
   str += lerp(p4(), v1, v2, "C ");
   str += lerp(p5(), v1, v2, "");
   str += lerp(p6(), v1, v2, "");
   str += lerp(p7(), v1, v2, "C ");
   str += lerp(p8(), v1, v2, "");
   str += lerp(p9(), v1, v2, "");
   return str;
}

function hlineseg(x, y, isnew) {
   var yeven = ((y + 1) % 4 == 0);
   var xeven = (x % 2 == 0);
   var yoff = (yeven ? xeven : !xeven) ? (-1.0 / 3) : (1.0 / 3);

   return gentab(process(x, y + yoff), process(x + 1, y - yoff), isnew);
}

function vlineseg(x, y) {
   return gentab(process(x, y + (1.0 / 3)), process(x, y + (5.0 / 3)), true);
}

function blineseg(x, y, isnew, rot) {
   var yeven = ((y + 1) % 4 == 0);
   var xeven = (x % 2 == 0);
   var yoff = (yeven ? xeven : !xeven) ? (-1.0 / 3) : (1.0 / 3);
   var str = "";
   var vec;
   if (isnew) {
      vec = process_r(x, y + yoff, rot);
      str += "M " + vec.x + " " + vec.y + " ";
   }
   vec = process_r(x + 1, y - yoff, rot);
   str += "L " + vec.x + " " + vec.y + " ";
   return str;
}

function gen_dh() {
   var str = "";
   var yl = 2 * n - 1;
   for (var yi = -yl + 2; yi <= yl - 2; yi = yi + 2) {
      var isnew = true;
      var xl = 2 * n - 1 - (Math.abs(yi) - 1) / 2;
      for (var xi = -xl + 1; xi < xl - 1; xi = xi + 1) {
         str += hlineseg(xi, yi, isnew);
         isnew = false;
      }
   }
   return str;
}

function gen_dv() {
   var str = "";
   var yl = 2 * n - 1;
   for (var yi = -yl; yi < yl; yi = yi + 2) {
      var xl = 2 * n - 1 - (Math.abs(yi + 1)) / 2;
      for (var xi = -xl + 2; xi <= xl - 2; xi = xi + 2) {
         str += vlineseg(xi, yi);
      }
   }
   return str;
}

function gen_db() {
   var str = "";

   if (!do_trunc) {
      var yi = 1 - 2 * n;
      var isnew = true;
      for (var rot = 0.0; rot < 2 * Math.PI - 0.1; rot = rot + Math.PI / 3) {
         for (var xi = -n; xi < n - 1; xi = xi + 1) {
            str += blineseg(xi, yi, isnew, rot);
            isnew = false;
         }
      }
   }
   else {
      if (do_warp) {
         str += "M " + offset + " " + (radius + offset) + " ";
         str += "a " + radius + " " + radius + " 0 1 0 " + (2 * radius) + " 0 ";
         str += "a " + radius + " " + radius + " 0 1 0 " + (-2 * radius) + " 0 ";
      }
      else {
         str += "M " + offset + " " + (radius + offset) + " ";
         str += "L " + (radius / 2 + offset) + " " + (radius + offset - radius * Math.sqrt(0.75)) + " ";
         str += "L " + (radius * 1.5 + offset) + " " + (radius + offset - radius * Math.sqrt(0.75)) + " ";
         str += "L " + (radius * 2 + offset) + " " + (radius + offset) + " ";
         str += "L " + (radius * 1.5 + offset) + " " + (radius + offset + radius * Math.sqrt(0.75)) + " ";
         str += "L " + (radius / 2 + offset) + " " + (radius + offset + radius * Math.sqrt(0.75)) + " ";
         str += "L " + offset + " " + (radius + offset) + " ";
      }
   }
   return str;
}

function update() {
   radius = 400;
   offset = 40;
   $("puzzlecontainer").setAttribute("width", 880);
   $("puzzlecontainer").setAttribute("height", 880);
   parse_input();
   $("puzzlepath_h").setAttribute("d", gen_dh());
   $("puzzlepath_v").setAttribute("d", gen_dv());
   $("puzzlepath_b").setAttribute("d", gen_db());
   const w = document.getElementById("diameter").value;
   const h = document.getElementById("rings").value;
   document.getElementById("image-info").innerText = `Diameter: ${w} mm | Rings: ${h} mm`;
}

function generate() {
   var diameter = parseFloat($("diameter").value);
   radius = diameter / 2.0;
   offset = radius * 0.2;
   var width = 2.0 * (radius + offset);
   var height = 2.0 * (radius + offset);
   parse_input();

   var data = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.0\" ";
   data += "width=\"" + width + "mm\" height=\"" + height + "mm\" viewBox=\"0 0 " + width + " " + height + "\">";
   data += "<path fill=\"none\" stroke=\"Black\" stroke-width=\"0.2\" d=\"";
   data += gen_dh();
   data += "\"></path>";
   data += "<path fill=\"none\" stroke=\"Black\" stroke-width=\"0.2\" d=\"";
   data += gen_dv();
   data += "\"></path>";
   data += "<path fill=\"none\" stroke=\"Black\" stroke-width=\"0.2\" d=\"";
   data += gen_db();
   data += "\"></path>";
   data += "</svg>";

   save("jigsaw.svg", data);

   // Simulated progress bar
   const progressBar = document.getElementById('progress-bar');
   const progress = document.getElementById('progress');
   progress.style.width = '0%';
   progressBar.style.display = 'block';
   let i = 0;
   const interval = setInterval(() => {
      i += 20;
      progress.style.width = i + '%';
      if (i >= 100) {
         clearInterval(interval);
         setTimeout(() => {
            progressBar.style.display = 'none';
            // Trigger real download here:
            // actual generate() logic in script.js
         }, 300);
      }
   }, 150);
}