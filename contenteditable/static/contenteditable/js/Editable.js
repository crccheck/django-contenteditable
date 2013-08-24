// handles converting a DOM Node to/from a contenteditable.
/*global document */


var Editable = (function($, dceApi, Medium) {
  "use strict";

  var Editable = function(el) {
    this.el = el;
    this.$el = $(el);
    this.editor = null;  // Medium.js editor
    var data = this.$el.data();
    var $editables = this.$el.find('[data-editfield]:not(.locked)');
    if ($editables.length){
      this.$editables = $editables;
    } else if (data.editfield) {
      this.$editables = this.$el;
    } else {
      throw "nothingToEdit";
    }
    this.$el.addClass('ui-editbox-active');
    this.storeState();
    this.init();
  };

  // Init
  //
  // change DOM and setup handlers
  Editable.prototype.init = function() {
    var self = this;
    // this.$editables
    //   .attr('contenteditable', 'true')
    //   .off('.editbox')  // clear any existing handlers just in case
    //   .on('keydown.editbox', function(e) {
    //     self.keyHandler.call(self, e);
    //   });
    this.editor = new Medium({
      debug: true,
      element: this.el
    });
    // FIXME remove hack once we get real ui for determining when we're done
    $(document).on('click.editbox', function(evt){
      if (!$(evt.target).closest('.ui-editbox-active').length) {
        try {
          self.save.call(self, evt);
        } catch (e){
          self.destroy.call(self);
          console.warn(e);
        }
        $(document).off('.editbox');
      }
    });
  };

  // Store the state of the $editables
  Editable.prototype.storeState = function() {
    // TODO
  };

  // Handler for keypresses while editing
  // Editable.prototype.keyHandler = function(evt) {
  //   switch (evt.which) {
  //     case 13:  // ENTER
  //       // this.save.call(this, evt);
  //       // // or
  //       // evt.preventDefault();
  //       // document.execCommand('insertParagraph', false, null);
  //     break;
  //     case 27:  // ESC
  //       this.save.call(this, evt);
  //     break;
  //   }
  // };

  // Save contents of element back
  Editable.prototype.save = function() {
    var $box = this.$el,
        data = $box.data(),
        meta = data.editmeta,
        pk = meta.pk,
        save_data = {};
    if (!meta.model){
      throw new Error("missing model");
    }
    if (pk){
      save_data.pk = pk;
    } else if (meta.slug) {
      save_data.slug = meta.slug;
      if (meta.slugfield){
        save_data.slugfield = meta.slugfield;
      }
    } else {
      throw new Error("missing PK");
    }
    var editables = $box.find('[data-editfield]');
    if (editables.length) {
      editables.each(function (_, el) {
        var name = $(el).attr('data-editfield');
        if (name) {
          save_data[name] = el.innerHTML;
        }
      });
    } else if (data.editfield) {
      save_data[data.editfield] = $.trim($box.html());
    } else {
      throw "missingData";
    }
    if (pk !== -1) {
      // UPDATE
      dceApi.save(meta.model, save_data);
      // INSERT
    } else {
      dceApi.insert(meta.model, save_data, function(data) {
        meta.pk = data.pk;
        $box.attr('data-editmeta', JSON.stringify(meta));
      });
    }
    this.destroy();
  };

  // Turns design mode off
  Editable.prototype.destroy = function() {
    this.editor.destroy();
    // workaround for Medium doing a terrible job of cleaning up after itself
    var classes = this.el.className.split(' ');
    classes = classes.filter(function(x) { return x.substr(0, 6) != 'Medium'; });
    this.el.className = classes.join(' ');

    this.$el.removeClass('ui-editbox-active')
      .removeAttr('contenteditable')
      .off('.editbox');  // XXX
  };

  return Editable;
})(window.jQuery, window.$contentEditable, window.Medium);
