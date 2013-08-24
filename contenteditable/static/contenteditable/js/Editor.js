// a dirt simple jquery contenteditable plugin
//
// notable prior art:
//
// * https://github.com/jakiestfu/Medium.js/blob/master/medium.js
// * https://github.com/makesites/jquery-contenteditable/blob/master/jquery.contenteditable.js

(function($) {
  "use strict";

  var NAME = 'contenteditableish';

  function Editor($el, options) {
    this.$el = $el;
    this.el = $el[0];
    this.init();
  }

  Editor.prototype.init = function() {
    var self = this;
    this.$el
      .attr('contenteditable', 'true')
      .on('keydown.' + NAME, function(e) {
        self.keyHandler.call(self, e);
      });
  };

  // Store the state of the contents
  Editor.prototype.storeState = function() {
    // TODO
  };

  // Handler for keypresses while editing
  Editor.prototype.keyHandler = function(evt) {
    switch (evt.which) {
      case 13:  // ENTER
        if (this.$el.is('h1, h2, h3, h4, h5')) {
          evt.preventDefault();
        }
        // this.save.call(this, evt);
        // // or
        // evt.preventDefault();
        // document.execCommand('insertParagraph', false, null);
      break;
      case 27:  // ESC
        // TODO
      break;
    }
  };

  Editor.prototype.destroy = function() {
    this.$el
      .removeAttr('contenteditable')
      .off('.' + NAME);
  };


  $.fn.contenteditable = function(options) {
    // nothing to do
    if (!this.length) {
      return this;
    }

    // destroy
    if (options === 'destroy') {
      this.each(function(idx, el) {
        var $el = $(el),
            editor = $el.data(NAME);
        editor.destroy();
      });
      return this;
    }

    // init
    this.each(function(idx, el) {
      var $el = $(el),
          editor = new Editor($el, options);
      $el.data(NAME, editor);
    });
    return this;
  };
})(window.jQuery);
