namespace :boolean do
  desc "Importa da file csv"
  task migrate: :environment do
    ActiveRecord::Base.establish_connection(ActiveRecord::Base.configurations[(Rails.env || "development")])
    User.where("blocked = 't'").update_all(blocked: 1)
    User.where("blocked = 'f'").update_all(blocked: 0)
  end

end
