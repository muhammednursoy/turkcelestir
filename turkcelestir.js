// Entry point for: osascript -l JavaScript turkcelestir.js <utf8-text-file>
// Prints the converted text. Throws (exit code 1) when the input cannot be read,
// so a caller never mistakes an empty result for a successful conversion.
//
// The algorithm itself is third-party code loaded from vendor/deasciifier/ next
// to this file; see vendor/deasciifier/README.md.

ObjC.import('Foundation');

function readUtf8(path) {
  if (!path) return null;
  var s = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
  if (s.isNil()) return null;
  return s.js;
}

function scriptDirectory() {
  var args = $.NSProcessInfo.processInfo.arguments.js;
  for (var i = 0; i < args.length; i++) {
    var a = args[i].js;
    if (/\.js$/.test(a)) {
      return $.NSString.stringWithString(a).stringByDeletingLastPathComponent.js;
    }
  }
  throw new Error('cannot locate turkcelestir.js on the command line');
}

var VENDOR_FILE = scriptDirectory() + '/vendor/deasciifier/deasciifier.js';
var vendorSource = readUtf8(VENDOR_FILE);
if (typeof vendorSource !== 'string') {
  throw new Error('missing ' + VENDOR_FILE);
}
(0, eval)(vendorSource);

function run(argv) {
  var text = readUtf8(argv[0]);
  if (typeof text !== 'string') {
    throw new Error('cannot read input file: ' + argv[0]);
  }
  return turkcelestir(text, loadDictionary());
}

// Spans matched here are copied back verbatim after conversion: links, mail
// addresses, paths, inline code, identifiers and handles are never Turkish words.
var PROTECTED_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`\n]*`/g,
  /\b(?:https?|ftp|file):\/\/[^\s<>"']+/gi,
  /\bwww\.[^\s<>"']+/gi,
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  /(?<=^|\s)(?:~|\.{1,2})?\/[\w.\-\/~]+/g,
  /(?<=^|\s)[@#][\w.]*\w/g,
  /\b[A-Za-z]*[\d_]\w*\b/g,
  /\b[a-z]+[A-Z][A-Za-z]*\b/g,
  /\b[A-Z][a-z]+(?:[A-Z][A-Za-z]*)+\b/g,
  /(?<=^|\s)--?[A-Za-z][\w-]*/g,
  /\b[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+\b/g,
  /\b[A-Za-z_]\w*(?:::\w+)+\b/g,
  /\b[A-Za-z_]\w*\(\)/g,
  /\$\{?[A-Za-z_]\w*\}?/g,
  /<\/?[A-Za-z][\w-]*>/g,
  /\{\{[^}]*\}\}/g
];

function protectedSpans(text) {
  var spans = [];
  PROTECTED_PATTERNS.forEach(function (re) {
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      spans.push([m.index, m.index + m[0].length]);
    }
  });
  spans.sort(function (a, b) { return a[0] - b[0]; });
  var merged = [];
  spans.forEach(function (s) {
    var last = merged[merged.length - 1];
    if (last && s[0] <= last[1]) {
      last[1] = Math.max(last[1], s[1]);
    } else {
      merged.push(s.slice());
    }
  });
  return merged;
}

function turkcelestir(text, dict) {
  var out = new Deasciifier().deasciify(text);
  // Deasciifier maps one UTF-16 unit to one unit; the position arithmetic below relies on it.
  if (out.length !== text.length) return out;
  var spans = protectedSpans(text);
  var chars = out.split('');
  spans.forEach(function (s) {
    for (var i = s[0]; i < s[1]; i++) chars[i] = text[i];
  });
  return applyDictionary(text, chars.join(''), dict, spans);
}

var WORD_RE = /[A-Za-zÇĞİÖŞÜçğıöşü]+/g;

function applyDictionary(text, out, dict, spans) {
  if (!dict) return out;
  var asciifier = new Asciifier();
  var replacements = [];
  WORD_RE.lastIndex = 0;
  var m;
  while ((m = WORD_RE.exec(text)) !== null) {
    var start = m.index, end = start + m[0].length;
    var inProtected = spans.some(function (s) { return start < s[1] && end > s[0]; });
    if (inProtected) continue;
    var value = dict[asciifier.asciify(m[0]).toLowerCase()];
    if (!value) continue;
    if (m[0][0] !== m[0][0].toLowerCase()) {
      value = value[0].toLocaleUpperCase('tr') + value.slice(1);
    }
    replacements.push([start, end, value]);
  }
  for (var i = replacements.length - 1; i >= 0; i--) {
    var r = replacements[i];
    out = out.slice(0, r[0]) + r[2] + out.slice(r[1]);
  }
  return out;
}

// Optional personal dictionary: ~/.hammerspoon/turkcelestir-sozluk.json, a flat
// object of {"asciiword": "türkçe karşılığı"}. Keys are matched after asciifying
// and lowercasing, so they may be written either way.
function loadDictionary() {
  var path = $.NSHomeDirectory().js + '/.hammerspoon/turkcelestir-sozluk.json';
  var s = readUtf8(path);
  if (typeof s !== 'string') return null;
  var raw;
  try {
    raw = JSON.parse(s);
  } catch (e) {
    throw new Error('turkcelestir-sozluk.json is not valid JSON: ' + e.message);
  }
  var asciifier = new Asciifier();
  var dict = {};
  Object.keys(raw).forEach(function (k) {
    dict[asciifier.asciify(k).toLowerCase()] = String(raw[k]);
  });
  return dict;
}
