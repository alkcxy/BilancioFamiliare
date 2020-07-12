class OperationsController < ApplicationController
  before_action :set_operation, only: [:show, :edit, :update, :destroy]
  before_action :authorize

  # GET /operations.json
  def index
    @operations = Operation.joins(:type, :user).order('date DESC')
    if params[:year]
      @operations.where!(year: params[:year])
    end
    if params[:month]
      @operations.where!(month: params[:month])
    end
    if params[:type_id]
      @operations.where!(type_id: params[:type_id])
    end
    if params[:q]
      @operations.where!("operations.note like :key or operations.amount like :key or users.name like :key or types.name like :key", key: "%"+params[:q]+"%")
    end
  end

  def max
    respond_to do |format|
      format.json { render :json => Operation.select("id, year, FROM_UNIXTIME(max(updated_at)) max").group(:year).to_json }
    end
  end

  def calendar_month
    respond_to do |format|
      format.json do
        @operations = Operation.by_month(params[:year], params[:month]).includes(:type, :user).order(:day)
        render :index
      end
    end
  end

  def calendar_year
    respond_to do |format|
      format.json do
        @operations = Operation.where(year: params[:year]).includes(:type, :user).order(:month)
        render :index
      end
    end
  end

  # GET /operations/1.json
  def show
  end

  # GET /operations/new
  def new
    @operation = Operation.new
  end

  # GET /operations/1/edit
  def edit
  end

  # POST /operations.json
  def create
    @operation = Operation.new(operation_params)
    respond_to do |format|
      if @operation.save
        operation = @operation.as_json(include: { type: { only: [:id, :name, :spending_roof, :spending_limit] }, user: { only: [:id, :name]} })
        ActionCable.server.broadcast 'operations', message: operation, method: "create", max: @operation.updated_at.to_i, year: @operation.year
        format.json { render :show, status: :created, location: @operation }
      else
        format.json { render json: @operation.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /operations/1.json
  def update
    respond_to do |format|
      if @operation.update(operation_params)
        operation = @operation.as_json(include: { type: { only: [:id, :name, :spending_roof, :spending_limit] }, user: { only: [:id, :name]} })
        ActionCable.server.broadcast 'operations', message: operation, method: "update", max: @operation.updated_at.to_i, year: @operation.year
        format.json { render :show, status: :ok, location: @operation }
      else
        format.json { render json: @operation.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /operations/1.json
  def destroy
    @operation.destroy
    operation = @operation.as_json(include: { type: { only: :name }, user: { only: :name} })
    last_operation = Operation.where(year: @operation.year).last
    last_operation.update(updated_at: Time.now)
    ActionCable.server.broadcast 'operations', message: operation, method: "destroy", max: last_operation.updated_at.to_i, year: @operation.year
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_operation
      @operation = Operation.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def operation_params
      params.require(:operation).permit(:note, :date, :sign, :amount, :type_id, :user_id, :repeat, :interval_repeat, :type_repeat, :week_repeat, :wday_repeat, :last_date_repeat)
    end
end
