module Repeatable
  extend ActiveSupport::Concern

  included do
    attr_accessor :repeat, :interval_repeat, :type_repeat, :week_repeat, :wday_repeat, :last_date_repeat

    def self.set_start_date s_date=nil
      @s_date = s_date
      def self.s_date
        @s_date
      end
    end

    def start_date
      ((self.class.s_date && method(self.class.s_date).call) || super)
    end

    def start_date= start_date
      ((self.class.s_date && method("#{self.class.s_date}=").call(start_date)) || super)
    end

    after_create do
      if repeat.to_i == 1
        type = type_repeat_by_id(type_repeat)
        type_method = case type.name.downcase
          when "giorni" then "days"
          when "mesi" then "months"
          when "settimane" then "weeks"
          else "days"
        end
        date_parse = nil
        i = 1
        while true
          repeatable = self.dup
          repeatable.repeat = 0
          date_repeat = (interval_repeat.to_i*i).method(type_method).call

          date_parse = start_date+date_repeat

          if type_method == "months"
            date_parse = date_parse.beginning_of_month
          end

          if type_method == "months" || type_method == "weeks"
            while date_parse.wday.to_i != wday_repeat.to_i
              date_parse += 1.day
            end
          end

          if type_method == "months"
            actual_month = date_parse.month
            date_parse += (week_repeat.to_i-1).weeks
            if actual_month != date_parse.month
              start_date_parse -= 1.week
            end
          end

          repeatable.start_date = date_parse
          # continue to next loop if last_date_repeat is greatr than start_date (or for any other error)
          i = i+1
          break if repeatable.start_date > Date.parse(last_date_repeat)
          next if !repeatable.save
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
