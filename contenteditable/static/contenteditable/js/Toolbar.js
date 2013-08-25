
var Toolbar = (function($) {
  "use strict";

  function Toolbar() {
    this.$el = null;
  }

  Toolbar.prototype.init = function() {
    this.$el = $('<div class="toolbar"></div>');
    this.$el.append('<btn>TODO</btn>');
    this.$el.appendTo('body');
  };

  Toolbar.prototype.attachTo = function($el) {
    if (!this.$el) {
      this.init();
    }
    console.log('attachTo', $el[0])
    var position = $el.offset();
    this.$el.css({
      left: position.left,
      top: position.top,
      width: $el.outerWidth() - 50
    });
  };

  Toolbar.prototype.destroy = function() {
    if (this.$el && this.$el.length) {
      // this.$el.detach();
      this.$el.remove();
      this.$el = null;
    }
  };

  return Toolbar;
})(window.jQuery);
