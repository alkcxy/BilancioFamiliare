class @DateHelper
  constructor: (date_time) ->
    try
      if date_time?.date_time?
        @date_time = date_time.date_time
      else if date_time?.getTime?
        @date_time = new Date(date_time)
      else if date_time?
        date_time_split = date_time.split("T")
        if date_time_split.length > 1
          date = date_time_split[0].split("-")
          time = date_time_split[1].split(":")
          @date_time = new Date(date[0], date[1]-1, date[2], time[0], time[1], time[2].split("+")[0])
        else
          @date_time = new Date(parseInt(date_time))
      else
        @date_time = new Date()
    catch e
      console.error e
      @date_time = new Date()

  # public method
  toDDMMYYYY: () ->
    @date_time.getDate()+"/"+(@date_time.getMonth()+1)+"/"+@date_time.getFullYear()

  dateRepeatPreview: (interval_repeat, type_repeat, week_repeat, wday_repeat, last_date_repeat) ->
    if type_repeat is "1"
      final_repeat = interval_repeat
    else if type_repeat is "2"
      final_repeat = interval_repeat*7
    else
      final_repeat = interval_repeat
    i = 1
    loop
      start_date_parse = new Date(@date_time)
      if type_repeat is "3" and week_repeat isnt ""
        @dayInMonth(start_date_parse, final_repeat*i, week_repeat, wday_repeat)
      else
        break if type_repeat is "3" and week_repeat is ""
        start_date_parse.setDate(start_date_parse.getDate()+final_repeat*i)
        if type_repeat is "2"
          break if wday_repeat is ""
          while start_date_parse.getDay() isnt parseInt(wday_repeat)
            start_date_parse.setDate(start_date_parse.getDate()+1)
      i = i+1
      break if start_date_parse > last_date_repeat
      new DateHelper(start_date_parse)

  dayInMonth: (date, interval_repeat, week_repeat=1, wday_repeat=0) ->
    date.setDate(1)
    date.setMonth(date.getMonth()+interval_repeat)
    month = date.getMonth()
    while parseInt(wday_repeat) isnt date.getDay()
      date.setDate(date.getDate()+1)
    day = date.getDate()+(7*(week_repeat-1))
    date.setDate(day)
    if day > 28
      while month isnt date.getMonth() or date.getDay() isnt parseInt(wday_repeat)
        date.setDate(date.getDate()-7)
    return null

  # static method
  @valueAsDate: (input_id) ->
    input = document.getElementById(input_id)
    return null if !input or !input.value? or input.value.trim() is '' or !input.valueAsDate?
    input.valueAsDate

if typeof module is "object" and module.exports
  module.exports = @DateHelper;
