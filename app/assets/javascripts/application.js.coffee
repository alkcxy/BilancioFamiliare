$(document).on('click', '.filter-toggle', () -> $('.filter-form').toggle())
.on('turbolinks:load', ->
  if $('.repeater[type="checkbox"]').is(":checked")
    $(".toggle-repeat").show();
    $('.type_repeat').trigger 'validation.repeater'
  $('.filter-form').toggle();
)
