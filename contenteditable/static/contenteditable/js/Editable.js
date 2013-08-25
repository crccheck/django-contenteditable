// handles converting a DOM Node to/from a contenteditable.
/*global document */


var Editable = (function($, dceApi, Editor) {
  "use strict";

  var NAME = 'editbox';


  var Editable = function(el) {
    this.el = el;
    this.$el = $(el);
    this.stateHash = [];
    var data = this.$el.data();
    var $editables = this.$el.find('[data-editfield]');
    if ($editables.length){
      this.$editables = $editables;
    } else if (data.editfield) {
      this.$editables = this.$el;
    } else {
      throw new Error("nothing to edit");
    }
    this.$el.addClass('ui-editbox-active');
    this.init();
  };

  // Init
  //
  // change DOM and setup handlers
  Editable.prototype.init = function() {
    var self = this;
    this.$editables.contenteditable();
    this.$el.on('editorDestroyed.' + NAME, function() {
      var $editing = self.$editables.filter('[contenteditable]');
      self.save();
    });
    this.storeStateHash();
  };

  // store hash of the state to detect if it changed
  Editable.prototype.storeStateHash = function() {
    // TODO a more robust hash
    this.stateHash.push(this.$editables.text());
  };

  Editable.prototype.addHelper = function(el) {
    this.$helper = $(el);
  };

  // Save contents of element back and then destroy self
  Editable.prototype.save = function() {
    this.storeStateHash();
    if (this.stateHash[this.stateHash.length - 1] == this.stateHash[0]) {
      console.log('nothing changed')
      this.destroy();
      return;
    }
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
    if (this.$helper) {
      this.$helper.text('Edit'); // XXX
    }
    this.$el
      .removeClass('ui-editbox-active')
      .off('.' + NAME);
    this.$editables.filter('[contenteditable]').contenteditable('destroy');
  };

  return Editable;
})(window.jQuery, window.$contentEditable, window.Editor);
