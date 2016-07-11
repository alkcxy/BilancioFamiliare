class HomeController < ApplicationController
  before_action :authorize

  # GET /users
  # GET /users.json
  def index
    @operations_per_sign = Operation.group(:sign, :year)
    @operations = Operation.select('*, master_types_types.name types_name, min(date) min, max(date) max, sum(amount) sum_amount').where(sign: "-").joins(:type).merge(Type.joins(:master_type)).group("master_types_types.id").order("types_name ASC")
  end
end
