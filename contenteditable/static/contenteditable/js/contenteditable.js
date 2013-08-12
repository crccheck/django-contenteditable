// Content editable support


// add csrf to ajax requests
// https://docs.djangoproject.com/en/1.3/ref/contrib/csrf/#upgrading-notesO
$(document).ajaxSend(function(event, xhr, settings) {
  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  function sameOrigin(url) {
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
        (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(url));
  }
  function safeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }

  if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
    xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
  }
});


var Editable = function(el) {
  this.init(el);
};

// Init
Editable.prototype.init = function(el) {
  this.el = el;
  this.$el = $(el);
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
  this.start();
};

// Start
//
// change DOM and setup handlers
Editable.prototype.start = function() {
  var self = this;
  this.$editables
    .attr('contenteditable', 'true')
    .off('.editbox')  // clear any existing handlers just in case
    .on('keydown.editbox', function(e) {
      self.keyHandler.call(self, e);
    });
  // FIXME remove hack once we get real ui for determining when we're done
  $(document).on('click.editbox', function(evt){
    if (!$(evt.target).closest('.ui-editbox-active').length) {
      try {
        self.save.call(self, evt);
      } catch (e){
        self.disable.call(self);
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
Editable.prototype.keyHandler = function(evt) {
  switch (evt.which) {
    case 13:  // ENTER
      // this.save.call(this, evt);
      // // or
      // evt.preventDefault();
      // document.execCommand('insertParagraph', false, null);
    break;
    case 27:  // ESC
      this.save.call(this, evt);
    break;
  }
};

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
    $contentEditable.save(data.editmodel, save_data);
  } else {
    $contentEditable.insert(data.editmodel, save_data, function(data) {
      $box.attr('data-editpk', data.pk);
    });
  }
  this.disable();
};

// Turns design mode off
Editable.prototype.disable = function() {
  this.$el.removeClass('ui-editbox-active')
    .find('[contentEditable]')
    .removeAttr('contenteditable')
    .off('.editbox');  // XXX
};


/*global $, confirm, console */
$(function(){
  "use strict";

  // Turns design mode on for editable elements
  //
  // this: the box element that contains all the editable elements
  var enableEditbox = function() {
    new Editable(this);
  };


  $('.clearonclick').click(function() {
    if ($(this).html() == $(this).attr('data-placeholder')) {
      $(this).html('');
    }
  }).blur(function () {
    if ($(this).html() === '') {
      $(this).html($(this).attr('data-placeholder'));
    }
  }).each(function (_, el1){
    if ($(el1).html().trim() === '') {
      $(el1).html($(this).attr('data-placeholder'));
    }
  });

  // not an efficient selector but makes this easier to implement in the templates
  $('[data-editpk], [data-editslug]')
    .addClass('ui-editbox')
    .on('dblclick', enableEditbox);
});


var $contentEditable = {
  options: {'url': '/contenteditable/'},
  init: function (options) {
    jQuery.extend($contentEditable.options, options);
  },
  save: function(model, data, success_callback) {
    console.log("Saving to "+$contentEditable.options['url']);
    console.log(data);

    $.ajax({
      type: 'POST',
      url: $contentEditable.options.url,
      data: jQuery.extend(data, {
        'model': model
      }),
      dataType: 'json'
    })
    .success(function(response) {
      console.log("Saved: ", response);
    })
    .success(success_callback)
    .error(function() {
      alert("Si è verificato un errore durante il salvataggio. Le modifiche potrebbero non essere state salvate.\nSe il problema persiste ricarica la pagina.");
    });
  },
  insert: function(model, data, success_callback){
    console.log("Inserting to " + $contentEditable.options['url']);
    console.log(data);
    $.ajax({
      type: 'PUT',
      url: $contentEditable.options.url,
      data: jQuery.extend(data, {
        'model': model
      }),
      dataType: 'json'
    })
    .success(function(response) {
      console.log("Inserted: ", response);
    })
    .success(success_callback)
    .error(function() {
      alert("Si è verificato un errore durante il salvataggio. Le modifiche potrebbero non essere state salvate.\nSe il problema persiste ricarica la pagina.");
    });
  },
  'delete': function(model, id) {
    console.log("Deleting <" + model + "> #" + id);
    $.ajax({
      type: 'DELETE',
      url: $contentEditable.options.url,
      data: jQuery.extend(data, {
        'model': model
      }),
      dataType: 'json'
    })
    .success(function(response) {
      console.log("Deleted: ", response);
      // document.location.reload();
    })
    .error(function() {
      alert("Impossibile eliminare l'elemento richiesto. La pagina verrà ricaricata.");
    });
  }
};
