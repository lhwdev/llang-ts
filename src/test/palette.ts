import { bgRgb24, bgRgb8, bold, rgb24, rgb8 } from "../../lib/utils/ansi.ts";

paletteRgb8();

export function escapes() {
  const size = Deno.consoleSize();

  console.log("\x1b]8;;https://naver.com/\x9cThis is link\x1b]8;;\x9c");

  let s = "";
  let line = 0;
  const newLine = () => {
    s += "\n";
    line = 0;
  };
  const print = (ss: string, l: number = ss.length) => {
    if (line + l >= size.columns) newLine();
    s += ss;
    line += l;
  };
  const block = (num: number | number[], str: string) => {
    let code;
    if (typeof num === "number") {
      num = [num];
      code = `${num}`;
    } else {
      code = num.join(";");
    }
    const head = `${num[0]} `.padStart(4);
    str = `${str}`.padEnd(9) + " ";
    print(`${head}\x1b[${code}m${str}\x1b[0m `, head.length + str.length);
  };
  block(1, "bold");
  block(2, "faint");
  block(3, "italic");
  block(4, "under");
  block(5, "slow blink");
  block(6, "fast blink");
  block(7, "invert");
  block(8, "conceal");
  block(9, "strike");
  block(21, "2-under");
  newLine();

  block(30, "black");
  block(31, "red");
  block(32, "green");
  block(33, "orange");
  block(34, "blue");
  block(35, "purple");
  block(36, "cyan");
  block(37, "white");
  newLine();

  block(40, "b-black");
  block(41, "b-red");
  block(42, "b-green");
  block(43, "b-oran");
  block(44, "b-blue");
  block(45, "b-pur");
  block(46, "b-cyan");
  block(47, "b-white");
  newLine();

  s += "\x1b[4m";
  block([58, 147], "underline color");
  block(73, "superscript");
  block(74, "subscript");
  newLine();

  block(90, "br-black");
  block(91, "br-red");
  block(92, "br-green");
  block(93, "br-oran");
  block(94, "br-blue");
  block(95, "br-pur");
  block(96, "br-cyan");
  block(97, "br-white");
  newLine();

  block(100, "bb-black");
  block(101, "bb-red");
  block(102, "bb-green");
  block(103, "bb-oran");
  block(104, "bb-blue");
  block(105, "bb-pur");
  block(106, "bb-cyan");
  block(107, "bb-white");
  newLine();

  print("\x1b#6HI!\x1b5", 3);

  console.log(s);
}

export function paletteRgb8() {
  console.log("ansi rgb8 palette showtime!");
  console.log(paletteRgb8Variant(bgRgb8, " "));
  console.log();
  console.log(bold(paletteRgb8Variant(rgb8, "\u2502")));
}

function paletteRgb8Variant(fn: (str: string, num: number) => string, h: string) {
  let s = "";
  const block = (num: number) => {
    s += fn(` ${num}`.padEnd(5), num);
  };

  for (let i = 0; i < 16; i++) block(i);
  s += "\n\n";
  if (Deno.consoleSize().columns >= 5 * 36 + 6) {
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 36; x++) {
        if (x % 6 == 0 && x != 0) s += h;
        block(16 + y * 36 + x);
      }
      s += "\n";
    }
  } else {
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 18; x++) {
        if (x % 6 == 0 && x != 0) s += h;
        block(16 + y * 36 + x);
      }

      s += "\n";
    }
    s += "\n";
    for (let y = 0; y < 6; y++) {
      for (let x = 18; x < 36; x++) {
        if (x % 6 == 0 && x != 0) s += h;
        block(16 + y * 36 + x);
      }
      s += "\n";
    }
  }
  s += "\n";
  {
    for (let i = 232; i < 256; i++) block(i);
    s += "\n";
  }
  return s;
}

export function paletteRgb24() {
  let s = "";
  let a = "";
  const block = (x: number, y: number) => {
    const r = x;
    const g = y;
    const b = 0;
    s += bgRgb24(" ", { r, g, b });
    a += rgb24("X", { r, g, b });
  };

  const stepX = 64;
  const stepY = 24;
  for (let y = 0; y < stepY; y++) {
    for (let x = 0; x < stepX; x++) {
      block(Math.floor(x * 256 / stepX), Math.floor(y * 256 / stepY));
    }
    s += "\n";
    a += "\n";
  }
  console.log(s);
  console.log(a);
}
