// handles converting a DOM Node to/from a contenteditable.
/*global document, toolbar */


var Editable = (function($, dceApi, Editor) {
  "use strict";

  var Editable = function(el) {
    this.el = el;
    this.$el = $(el);
    var data = this.$el.data();
    this.$data = data;
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
    // toolbar.attachTo(this.$el);
  };

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
    this.$el
      .removeClass('ui-editbox-active')
      .off('.editbox');  // XXX
    this.$editables.contenteditable('destroy');
  };

  return Editable;
})(window.jQuery, window.$contentEditable, window.Editor);
