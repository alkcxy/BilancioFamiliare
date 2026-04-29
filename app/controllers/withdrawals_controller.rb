class WithdrawalsController < ApplicationController
  before_action :set_withdrawal, only: [:show, :edit, :update, :destroy]
  before_action :authorize

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

  # POST /withdrawals/check_duplicates.json
  def check_duplicates
    rows = params.require(:rows).map { |r| r.permit(:date, :amount, :note) }
    matches = rows.each_with_index.filter_map do |row, i|
      date = Date.parse(row[:date].to_s) rescue nil
      next unless date
      date_range = (date - 2.days)..(date + 2.days)
      amount = row[:amount].to_f

      probable = Withdrawal
        .where(date: date_range)
        .where('ABS(amount - ?) <= 2.00', amount)
        .first

      if probable
        { index: i, match: { id: probable.id, amount: probable.amount, date: probable.date, note: probable.note, kind: 'probable' } }
      elsif row[:note].present?
        key = row[:note].to_s.split(/\s+/).select { |w| w.length >= 4 }.max_by(&:length)
        if key
          possible = Withdrawal.where(date: date_range).where('note LIKE ?', "%#{key}%").first
          possible && { index: i, match: { id: possible.id, amount: possible.amount, date: possible.date, note: possible.note, kind: 'possible' } }
        end
      end
    end
    render json: matches
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
        format.json { render json: @withdrawal.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH/PUT /withdrawals/1.json
  def update
    respond_to do |format|
      if @withdrawal.update(withdrawal_params)
        format.json { render :show, status: :ok, location: @withdrawal }
      else
        format.json { render json: @withdrawal.errors, status: :unprocessable_content }
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
