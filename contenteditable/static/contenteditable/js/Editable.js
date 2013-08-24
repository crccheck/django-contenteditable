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
        pk = data.editpk,
        save_data = {};
    if (!data.editmodel){
      throw "missingModel";
    }
    if (pk){
      save_data.pk = pk;
    } else if (data.editslug) {
      save_data.slug = data.editslug;
      if (data.editslugfield){
        save_data.slugfield = data.editslugfield;
      }
    } else {
      throw "missingPK";
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
      dceApi.save(data.editmodel, save_data);
    } else {
      dceApi.insert(data.editmodel, save_data, function(data) {
        $box.attr('data-editpk', data.pk);
      });
    }
    this.destroy();
  };

  // Turns design mode off
  Editable.prototype.destroy = function() {
    this.editor.destroy();
    this.$el.removeClass('ui-editbox-active')
      .find('[contentEditable]')
      .removeAttr('contenteditable')
      .off('.editbox');  // XXX
  };

  return Editable;
})(window.jQuery, window.$contentEditable, window.Medium);
