module Repeatable
  extend ActiveSupport::Concern

  included do
    attr_accessor :repeat, :date_end, :interval_repeat, :type_repeat, :week_repeat, :wday_repeat, :last_date_repeat

    def self.set_start_date s_date=nil
      @s_date = s_date
      def self.s_date
        @s_date
      end
    end

    def full_text
      @start_date ||= ((self.class.s_date && method(self.class.s_date).call) || super)
    end

    before_create do
      if repeat.to_i == 1
        type = type_repeat_by_id(event.type_repeat)
        type_method = case type.name.downcase
          when "giorni" then "days"
          when "mesi" then "months"
          when "settimane" then "weeks"
          else "days"
        end
        duration = Date.parse(end_date)-Date.parse(start_date)
        start_date_parse = nil
        i = 0
        while true
          repeat_event = self.new(attributes)
          # meglio pubblicare subito solo eventi ripetuti creati da admin
          repeat_event.repeat = 0
          date_repeat = (event.interval_repeat.to_i*i).method(type_method).call

          start_date_parse = Date.parse(start_date)+date_repeat

          if type_method == "months"
            start_date_parse = start_date_parse.beginning_of_month
          end
          if type_method == "months" || type_method == "weeks"
            while start_date_parse.wday.to_i != wday_repeat.to_i
              start_date_parse += 1.day
            end
          end
          if type_method == "months"
            actual_month = start_date_parse.month
            start_date_parse += (week_repeat.to_i-1).weeks
            if actual_month != start_date_parse.month
              start_date_parse -= 1.week
            end
          end

          repeat_event.start_date = start_date_parse.to_s
          repeat_event.end_date = (start_date_parse+duration).to_s
          repeat_event.run_at = (3*i).seconds.from_now
          # continue to next loop if last_date_repeat is greatr than start_date (or for any other error)
          i = i+1
          break if repeat_event.start_date < end_date
          next if !repeat_event.save
        end
      end
    end

    def types_repeat
      [OpenStruct.new({id: 1, name: "Giorni"}),OpenStruct.new({id: 2, name: "Settimane"}),OpenStruct.new({id: 3, name: "Mesi"})]
    end

    def weeks_repeat
      [
        OpenStruct.new({id: 1, name: "Primo"}),OpenStruct.new({id: 2, name: "Secondo"}),OpenStruct.new({id: 3, name: "Terzo"}),
        OpenStruct.new({id: 4, name: "Quarto"}),OpenStruct.new({id: 5, name: "Ultimo"})
        ]
    end

    def wdays_repeat
      [
        OpenStruct.new({id: 1, name: "Lunedì"}),OpenStruct.new({id: 2, name: "Martedì"}),OpenStruct.new({id: 3, name: "Mercoledì"}),
        OpenStruct.new({id: 4, name: "Giovedì"}),OpenStruct.new({id: 5, name: "Venerdì"}),OpenStruct.new({id: 6, name: "Sabato"}),
        OpenStruct.new({id: 0, name: "Domenica"})
        ]
    end

    def type_repeat_by_id id
      self.types_repeat.each do |type|
        return type if type.id.to_i == id.to_i
      end
      return nil
    end
  end
end
