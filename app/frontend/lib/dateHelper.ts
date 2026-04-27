class DateHelper {
  constructor(date_time) {
    try {
      if (date_time != null && date_time.date_time != null) {
        this.date_time = date_time.date_time;
      } else if (date_time != null && typeof date_time.getTime === 'function') {
        this.date_time = new Date(date_time);
      } else if (date_time != null) {
        const date_time_split = date_time.split("T");
        if (date_time_split.length > 1) {
          const date = date_time_split[0].split("-");
          const time = date_time_split[1].split(":");
          this.date_time = new Date(date[0], date[1] - 1, date[2], time[0], time[1], time[2].split("+")[0]);
        } else {
          this.date_time = new Date(parseInt(date_time));
        }
      } else {
        this.date_time = new Date();
      }
    } catch (e) {
      console.error(e);
      this.date_time = new Date();
    }
  }

  toDDMMYYYY() {
    return this.date_time.getDate() + "/" + (this.date_time.getMonth() + 1) + "/" + this.date_time.getFullYear();
  }

  dateRepeatPreview(interval_repeat, type_repeat, week_repeat, wday_repeat, last_date_repeat) {
    let final_repeat;
    if (type_repeat === "1") {
      final_repeat = interval_repeat;
    } else if (type_repeat === "2") {
      final_repeat = interval_repeat * 7;
    } else {
      final_repeat = interval_repeat;
    }

    const results = [];
    let i = 1;

    while (true) {
      const start_date_parse = new Date(this.date_time);
      if (type_repeat === "3" && week_repeat !== "") {
        this.dayInMonth(start_date_parse, final_repeat * i, week_repeat, wday_repeat);
      } else {
        if (type_repeat === "3" && week_repeat === "") { break; }
        start_date_parse.setDate(start_date_parse.getDate() + final_repeat * i);
        if (type_repeat === "2") {
          if (wday_repeat === "") { break; }
          while (start_date_parse.getDay() !== parseInt(wday_repeat)) {
            start_date_parse.setDate(start_date_parse.getDate() + 1);
          }
        }
      }
      i = i + 1;
      if (start_date_parse > last_date_repeat) { break; }
      results.push(new DateHelper(start_date_parse));
    }

    return results;
  }

  dayInMonth(date, interval_repeat, week_repeat = 1, wday_repeat = 0) {
    date.setDate(1);
    date.setMonth(date.getMonth() + interval_repeat);
    const month = date.getMonth();
    while (parseInt(wday_repeat) !== date.getDay()) {
      date.setDate(date.getDate() + 1);
    }
    const day = date.getDate() + (7 * (week_repeat - 1));
    date.setDate(day);
    if (day > 28) {
      while (month !== date.getMonth() || date.getDay() !== parseInt(wday_repeat)) {
        date.setDate(date.getDate() - 7);
      }
    }
    return null;
  }

  static valueAsDate(input_id) {
    const input = document.getElementById(input_id);
    if (!input || input.value == null || input.value.trim() === '' || input.valueAsDate == null) {
      return null;
    }
    return input.valueAsDate;
  }
}

export default DateHelper;
