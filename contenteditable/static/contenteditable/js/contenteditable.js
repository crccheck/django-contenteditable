// Content editable support

/*global $, confirm, console, Editable, Toolbar */
$(function(){
  "use strict";

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

  var toolbar = new Toolbar();
  window.toolbar = toolbar;
  var $helpers = $('<div/>').appendTo(document.body);

  // not an efficient selector but makes this easier to implement in the templates
  $('[data-editmeta]')
    .addClass('ui-editbox')
    .each(function() {
      var $el = $(this),
          position = $el.offset();

      var $helper = $('<span class="editme" style="position: absolute; width: 50px;">Edit</span>')
        .css({
          left: position.left + $el.outerWidth() - 50,
          top: position.top
        })
        .hover(
          function() {
            $el.addClass('dce-hover');
          },
          function() {
            $el.removeClass('dce-hover');
          })
        .on('click', function() {
          // manually toggle between edit and save
          var edit = $el.data('_dceediting');
          if (edit) {
            edit.save();
            edit.destroy();
            $el.removeData('_dceediting');
            $helper.text('Edit');
          } else {
            edit = new Editable($el[0]);
            $el.data('_dceediting', edit);
            $helper.text('Save');
          }
        })
        .appendTo($helpers);
    });
});
