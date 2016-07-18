$(document).on 'validation.repeater', '.repeater[type="checkbox"]', () ->
  if $(this).is(":checked")
    $('.repeater-required ').prop('required', true)
    $('.toggle-repeat').show('fade')
  else
    $('.repeater-required').each () ->
      this.setCustomValidity("")
      if $(this).parent().hasClass("field_with_errors")
        $(this).unwrap()
    $('.toggle-repeat').hide('fade')
    $('.repeater-required ').val('')
    $('.repeater-required ').prop('required', false)
    $('.wday_repeat').trigger("field.hide")
    $('.week_repeat').trigger("field.hide")
.on 'validation.repeater', '.repeater', () ->
    $('.repeater').each () ->
      this.setCustomValidity("")
.on 'validation.repeater', '.type_repeat', (e) ->
  if $(this).val() in ['2','3']
    $('.wday_repeat').trigger("field.show")
  else
    $('.wday_repeat').trigger("field.hide")
  if $(this).val() is '3'
    $('.week_repeat').trigger("field.show")
  else
    $('.week_repeat').trigger("field.hide")
.on 'change', '.repeater', () ->
  $(this).trigger 'validation.repeater'
.on 'field.show', '.wday_repeat', () ->
  $('.toggle-month-repeat').show()
  $this = $(this)
  $this.prop('required', true)
  if start_date = DateHelper.valueAsDate('operation_date')
    $this.val(start_date.getDay())
.on 'field.hide', '.wday_repeat', () ->
  $this = $(this)
  $this.prop('required', false).val('')
  if $this.parent().hasClass("field_with_errors")
    $this.unwrap()
  $('.toggle-month-repeat').hide()
.on 'field.show', '.week_repeat', () ->
  $('.operation_span_week_repeat').removeClass('toggle-week-repeat')
  $(this).prop('required', true)
.on 'field.hide', '.week_repeat', () ->
  $this = $(this)
  $this.prop('required', false).val('')
  if $this.parent().hasClass("field_with_errors")
    $this.unwrap()
  $('.operation_span_week_repeat').addClass('toggle-week-repeat')
.on 'validation.repeater', '.repeater', (e) ->
  last_date_repeat = DateHelper.valueAsDate('operation_last_date_repeat')
  $('#repeater-preview').empty()
  if $('.repeater[type="checkbox"]').is(":checked") and last_date_repeat? and $('#operation_date').val() isnt "" and
  parseInt($('.interval_repeat').val()) > 0 and ($('.type_repeat').val() is "1" or ($('.type_repeat').val() is "2" and $('.wday_repeat').val() isnt "") or
  ($('.type_repeat').val() is "3" and $('.wday_repeat').val() isnt "" and $('.week_repeat').val() isnt ""))
    start_date = DateHelper.valueAsDate "operation_date"
    start_date_time = new DateHelper(start_date)
    repeaters = start_date_time.dateRepeatPreview($('.interval_repeat').val(),$('.type_repeat').val(),$('.week_repeat').val(),$('.wday_repeat').val(),last_date_repeat)
    element_interval_repeat = document.getElementById("operation_interval_repeat")
    last_date_repeat = document.getElementById("operation_last_date_repeat")
    stop = false
    render = ""
    $('.repeater').each () ->
      if this.validationMessage isnt ""
        render = """<div class="alert alert-danger">#{this.validationMessage}</div>"""
        stop = true
        return false
    $('#repeater-preview').append(render)
    if !stop
      if repeaters.length > 0
        $('#repeater-preview').append('<ul class="nav nav-pills nav-stacked"></ul>')
      for repeater in repeaters
        $('#repeater-preview ul').append("<li>#{repeater.toDDMMYYYY()}</li>")
      if repeaters.length is 0
        msgError = 'Con questa configurazione non verranno create nuove date. Provare a spostare più avanti la data Termina entro'
        last_date_repeat.setCustomValidity(msgError)
        $('#repeater-preview').append("<div class=\"alert alert-danger\">#{msgError}</div>")
      else
        last_date_repeat.setCustomValidity("")
$ () ->
  if $('.repeater[type="checkbox"]').is(":checked")
    $(".toggle-repeat").show();
    $('.type_repeat').trigger 'validation.repeater'
