
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
