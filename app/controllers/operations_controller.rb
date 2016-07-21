class OperationsController < ApplicationController
  before_action :set_operation, only: [:show, :edit, :update, :destroy]
  before_action :authorize

  # GET /operations
  # GET /operations.json
  def index
    @operations = Operation.includes(:type, :user).order('date DESC')
  end

  def calendar_month
    @operations = Operation.by_month(params[:year], params[:month])
    @types = Type.of_the_year_and_month(params[:year], params[:month])
    @operations_per_type = Operation.by_month(params[:year], params[:month]).order(:day)
    @tot_operations_per_type = Operation.tot_operations_per_type_per_year(params[:year]).where(month: params[:month])
  end

  def calendar_year
    @types = Type.of_the_year(params[:year])

    @operations_per_type = Operation.where(year: params[:year])

    @tot_operations_per_type = Operation.tot_operations_per_type_per_year(params[:year])

    @operations_per_month = Array.new(12).map.with_index do |v,k|
      v = Operation.by_month(params[:year], k+1)
    end

    @operations_cumulus = Operation.where(year: params[:year])
    @operations_cumulus_prev = Operation.where(year: params[:year].to_i-1)
  end

  # GET /operations/1
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

  # POST /operations
  # POST /operations.json
  def create
    @operation = Operation.new(operation_params)

    respond_to do |format|
      if @operation.save
        format.html { redirect_to @operation, notice: 'Operation was successfully created.' }
        format.json { render :show, status: :created, location: @operation }
      else
        format.html { render :new }
        format.json { render json: @operation.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /operations/1
  # PATCH/PUT /operations/1.json
  def update
    respond_to do |format|
      if @operation.update(operation_params)
        format.html { redirect_to @operation, notice: 'Operation was successfully updated.' }
        format.json { render :show, status: :ok, location: @operation }
      else
        format.html { render :edit }
        format.json { render json: @operation.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /operations/1
  # DELETE /operations/1.json
  def destroy
    @operation.destroy
    respond_to do |format|
      format.html { redirect_to operations_url, notice: 'Operation was successfully destroyed.' }
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
