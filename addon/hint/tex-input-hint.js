// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

// TeX-style completion, written by Emilio J. Gallego Arias.

// List of open issues before a merge can be considered:
//
// - Make the unicode table a parameter.
//
// - Review if the way we capture '\' is comforming to CM coding standards.
//
// - We register a helper for "hint.coq", but we would like this
//   helper to be available to all modes.

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {

  var Pos = CodeMirror.Pos;

  // XXX: Generate automatically...
  var unicodePreTable = [
    // { text: "\\",       symbol: "\\"},
    { text: "\\_1",     symbol: "₁" },
    { text: "\\_2",     symbol: "₂" },
    { text: "\\alpha",  symbol: "α" },
    { text: "\\arrow",  symbol: "→" },
    { text: "\\beta",   symbol: "β" },
    { text: "\\delta",  symbol: "δ" },
    { text: "\\exists", symbol: "∃" },
    { text: "\\forall", symbol: "∀" },
    { text: "\\gamma",  symbol: "γ" },
    { text: "\\land",   symbol: "∧" },
    { text: "\\lnot",   symbol: "¬" },
    { text: "\\lor",    symbol: "∨" },
    { text: "\\pi",     symbol: "π" },
    { text: "\\phi",    symbol: "φ" },
    { text: "\\psi",    symbol: "ψ" },
    { text: "\\times",  symbol: "×" },
    { text: "\\vdash",  symbol: "⊢" },
    { text: "\\Delta",  symbol: "Δ" },
    { text: "\\Gamma",  symbol: "Γ" },
    { text: "\\Pi",     symbol: "Π" }
  ];

  /* How our TeX-style completion works:

     We always complete on a press of "\":

     - We assume the current token starts starts with "\", but we stop
       at the cursor, this allows to insert unicode in the middle of a
       token.
       [XXX: Should we scan back to the point "\" appears?]

     - We generate the table, and add a handler to insert the proper
       unicode.

   */
  function TeX_input_hint(editor, _options) {

    var cur = editor.getCursor(), token = editor.getTokenAt(cur);

    // IMPORTANT: We match from the beginning of the token up to the
    // cursor only!

    // Thus, our end position is always cur.pos, and we must trim the
    // token.

    var curPos = Pos(cur.line, cur.ch);

    // XXX: Scan back to first "\" ?
    var matchStart = Pos(cur.line, token.start);
    var matchEnd   = curPos;

    var tokenToMatch = token.string.substr(0, matchEnd.ch - matchStart.ch);

    // console.log('cur/tok', cur, token, tokenToMatch);

    // Replace the current token !
    var insertFun = function(cm, _self, data) {
      cm.replaceRange(data.symbol, matchStart, matchEnd);
    };

    var rList = [];

    // Build of our table
    unicodePreTable.map( function(obj) {
      // console.log('Considering: ', obj, ' for ', tokenToMatch);

      if ( obj.text.startsWith(tokenToMatch) ) {
        // XXX: This can be improved for sure.
        obj.displayText = obj.symbol + ' ' + obj.text;
        obj.hint = insertFun;
        rList.push(obj);
      }
    });

    return { list: rList,
             from: matchStart,
             to:   matchEnd
           }
  };

  // We bind '\\'
  function initTexInput (CodeMirror) {

    // We bind slash to the latex autocomplete symbol.
    // We also bind Space to insert current hint.
    CodeMirror.defineInitHook(function (cm) {

      // XXX: Do we want to hook on "_" and "^", etc... ?
      cm.addKeyMap({"\\": function(cm)
                    {
                      cm.replaceSelection("\\");
                      cm.execCommand("autocomplete");
                    }});

      // We need to update the local keymap to the hints.
      var extraHintKeyMap = { Space: function(cm) {

        var cA = cm.state.completionActive;

        if (cA) {
          cA.widget.pick();
          // XXX: Ummmm, not if I want this...
          // cm.replaceSelection(" ");
        } } };

      var cmplOpt = cm.getOption("hintOptions");

      cmplOpt = cmplOpt || {};
      cmplOpt['extraKeys'] = extraHintKeyMap;
      cm.setOption("hintOptions", cmplOpt);

    });

    CodeMirror.registerHelper("hint", "coq", TeX_input_hint);
  }

  initTexInput(CodeMirror);
});

// Local Variables:
// js-indent-level: 2
// End:

