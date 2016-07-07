class HomeController < ApplicationController
  # GET /users
  # GET /users.json
  def index
    @operations_per_sign = Operation.group(:sign, :year)
    @operations = Operation.select('*, types.name types_name, min(date) min, max(date) max, sum(amount) sum_amount').where(sign: "-").joins(:type).group("types.name")
  end
end
