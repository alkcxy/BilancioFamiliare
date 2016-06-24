namespace :import do
  desc "Importa da file csv"
  task csv: :environment do
    unless file = ENV["file"]
      puts "Seleziona un file csv"
    end
    ActiveRecord::Base.establish_connection(ActiveRecord::Base.configurations[(Rails.env || "development")])
#    begin
      IO.foreach(file) do |line|
#        puts line
        fields = line.split(/"*,"*/)
#        puts fields
        f = 1
        type = Type.where(name: fields[0]).first_or_create
#        puts type.errors.inspect
        (1..12).each do |month|
          create_operation(ENV["year"], month, ENV["sign"], 1, type.id, fields[f])
          create_operation(ENV["year"], month, ENV["sign"], 2, type.id, fields[f+1])
          f = f+3
        end
      end
#    rescue

#    end
  end

  def create_operation(year, month, sign, user_id, type_id, amount)
    if !amount.blank? && amount.to_i != 0
      operation = Operation.create(date: Time.new(year, month, 1), type_id: type_id, sign: sign, user_id: user_id, amount: amount.to_f)
    end
  end
end
