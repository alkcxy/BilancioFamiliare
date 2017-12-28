$(document)
.on 'change', '.repeater', (e) ->
  last_date_repeat = DateHelper.valueAsDate('last_date_repeat')
  $('#repeater-preview').empty()
  if $('.repeater[type="checkbox"]').is(":checked") and last_date_repeat? and $('#date').val() isnt "" and
  parseInt($('.interval_repeat').val()) > 0 and ($('.type_repeat').val() is "1" or ($('.type_repeat').val() is "2" and $('.wday_repeat').val() isnt "") or
  ($('.type_repeat').val() is "3" and $('.wday_repeat').val() isnt "" and $('.week_repeat').val() isnt ""))
    start_date = DateHelper.valueAsDate "date"
    start_date_time = new DateHelper(start_date)
    repeaters = start_date_time.dateRepeatPreview($('.interval_repeat').val(),$('.type_repeat').val(),$('.week_repeat').val(),$('.wday_repeat').val(),last_date_repeat)
    element_interval_repeat = document.getElementById("interval_repeat")
    last_date_repeat = document.getElementById("last_date_repeat")
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
        $('#repeater-preview').append('<ul class="nav flex-column"></ul>')
      for repeater in repeaters
        $('#repeater-preview ul').append("<li class=\"nav-item\">#{repeater.toDDMMYYYY()}</li>")
      if repeaters.length is 0
        msgError = 'Con questa configurazione non verranno create nuove date. Provare a spostare più avanti la data Termina entro'
        $('#repeater-preview').append("<div class=\"alert alert-danger\">#{msgError}</div>")
