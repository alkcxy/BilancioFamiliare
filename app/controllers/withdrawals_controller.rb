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
      probable_range = (date - 1.day)..date
      possible_range = (date - 2.days)..date
      amount = row[:amount].to_f
      key = row[:note].present? ? row[:note].to_s.split(/\s+/).select { |w| w.length >= 4 }.max_by(&:length) : nil

      or_parts = []
      or_binds = []

      # Probable: ±€2 + date 0–1 days after existing (no category for withdrawals)
      or_parts << "(date BETWEEN ? AND ? AND ABS(amount - ?) <= 2.00)"
      or_binds.push(probable_range.begin, probable_range.end, amount)

      # Possible: note similarity + ±€2 + date 0–2 days after existing
      if key
        or_parts << "(date BETWEEN ? AND ? AND ABS(amount - ?) <= 2.00 AND note LIKE ?)"
        or_binds.push(possible_range.begin, possible_range.end, amount, "%#{key}%")
      end

      # Possible: exact amount + date 0–2 days after existing
      or_parts << "(date BETWEEN ? AND ? AND amount = ?)"
      or_binds.push(possible_range.begin, possible_range.end, amount)

      results = Withdrawal
        .includes(:user)
        .where([or_parts.join(' OR '), *or_binds])
        .to_a

      next if results.empty?

      match_list = results.map do |wd|
        is_probable = (wd.amount.to_f - amount).abs <= 2.0 && probable_range.cover?(wd.date)
        wd_match(wd, is_probable ? 'probable' : 'possible')
      end

      { index: i, matches: match_list }
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

    def wd_match(wd, kind)
      { id: wd.id, amount: wd.amount, date: wd.date, note: wd.note,
        user_name: wd.user&.name, kind: kind }
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def withdrawal_params
      params.require(:withdrawal).permit(:amount, :date, :note, :user_id, :complete, :archive)
    end
end
