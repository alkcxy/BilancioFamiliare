class WithdrawalsController < ApplicationController
  before_action :set_withdrawal, only: [:show, :edit, :update, :destroy]

  # GET /withdrawals.json
  def index
    @withdrawals = Withdrawal.where(complete: false)
  end

  # GET /withdrawals/all.json
  def all
    @withdrawals = Withdrawal.where(archive: false)
  end

  # GET /withdrawals/all.json
  def archive
    @withdrawals = Withdrawal.where(archive: true, complete: true)
  end

  # GET /withdrawals/1.json
  def show
  end

  # GET /withdrawals/new
  def new
    @withdrawal = Withdrawal.new
  end

  # GET /withdrawals/1/edit
  def edit
  end

  # POST /withdrawals.json
  def create
    @withdrawal = Withdrawal.new(withdrawal_params)

    respond_to do |format|
      if @withdrawal.save
        format.json { render :show, status: :created, location: @withdrawal }
      else
        format.json { render json: @withdrawal.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /withdrawals/1.json
  def update
    respond_to do |format|
      if @withdrawal.update(withdrawal_params)
        format.json { render :show, status: :ok, location: @withdrawal }
      else
        format.json { render json: @withdrawal.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /withdrawals/1.json
  def destroy
    @withdrawal.destroy
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_withdrawal
      @withdrawal = Withdrawal.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def withdrawal_params
      params.require(:withdrawal).permit(:amount, :date, :note, :user_id, :complete, :archive)
    end
end
