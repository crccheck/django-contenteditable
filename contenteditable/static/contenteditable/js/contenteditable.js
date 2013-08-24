// Content editable support

/*global $, confirm, console, Editable */
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
