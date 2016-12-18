class HomeController < ApplicationController
  before_action :authorize

  # GET /users
  # GET /users.json
  def index
    now = Time.now
    @operations_per_sign = Operation.group(:sign, :year)
    @type_operations = Operation.select('*, master_types_types.name types_name, min(date) min, max(date) max, sum(amount) sum_amount').where(sign: "-").joins(:type).merge(Type.joins(:master_type)).group("master_types_types.id").order("types_name ASC")
    @monthly_operations = Operation.joins(:type).where(sign: "-").where("date < ?", Time.now.end_of_month).group("master_types_types.name").group("year||'/'||month").merge(Type.joins(:master_type))

    @saldo_totale = Operation.where(sign: "+").where("year < :year or (year = :year and month < :month) or (year = :year and month = :month and day <= :day)", year: now.year, month: now.month, day: now.day).sum(:amount) - Operation.where(sign: "-").where("year < :year or (year = :year and month < :month) or (year = :year and month = :month and day <= :day)", year: now.year, month: now.month, day: now.day).sum(:amount)

    if params[:year]
      @operations_per_sign.where!(year: params[:year])
      @type_operations.where!(year: params[:year])
      @monthly_operations.where!(year: params[:year])
    end

    if params[:month]
      @operations_per_sign.where!(month: params[:month])
    end

    if params[:type_id]
      @operations_per_sign.where!(type_id: params[:type_id])
      @type_operations.where!(type_id: params[:type_id])
      @monthly_operations.where!(type_id: params[:type_id])
    end
  end
end
