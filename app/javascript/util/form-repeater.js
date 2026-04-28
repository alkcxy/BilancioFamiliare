import DateHelper from './date-helper';

$(document)
  .on('change', '.repeater', function() {
    const last_date_repeat = DateHelper.valueAsDate('last_date_repeat');
    $('#repeater-preview').empty();

    if (
      $('.repeater[type="checkbox"]').is(":checked") &&
      last_date_repeat != null &&
      $('#date').val() !== "" &&
      parseInt($('.interval_repeat').val()) > 0 &&
      (
        $('.type_repeat').val() === "1" ||
        ($('.type_repeat').val() === "2" && $('.wday_repeat').val() !== "") ||
        ($('.type_repeat').val() === "3" && $('.wday_repeat').val() !== "" && $('.week_repeat').val() !== "")
      )
    ) {
      const start_date = DateHelper.valueAsDate("date");
      const start_date_time = new DateHelper(start_date);
      const repeaters = start_date_time.dateRepeatPreview(
        $('.interval_repeat').val(),
        $('.type_repeat').val(),
        $('.week_repeat').val(),
        $('.wday_repeat').val(),
        last_date_repeat
      );

      if (repeaters.length > 0) {
        $('#repeater-preview').append('<ul class="nav flex-column"></ul>');
      }
      for (const repeater of repeaters) {
        $('#repeater-preview ul').append(`<li class="nav-item">${repeater.toDDMMYYYY()}</li>`);
      }
      if (repeaters.length === 0) {
        const msgError = 'Con questa configurazione non verranno create nuove date. Provare a spostare più avanti la data Termina entro';
        $('#repeater-preview').append(`<div class="alert alert-danger">${msgError}</div>`);
      }
    }
  });
