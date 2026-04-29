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

  # POST /operations/check_duplicates.json
  def check_duplicates
    rows = params.require(:rows).map { |r| r.permit(:date, :amount, :type_id, :note) }
    matches = rows.each_with_index.filter_map do |row, i|
      date = Date.parse(row[:date].to_s) rescue nil
      next unless date
      probable_range = (date - 1.day)..date
      possible_range = (date - 2.days)..date
      amount = row[:amount].to_f

      probable = row[:type_id].present? && Operation
        .where(date: probable_range, type_id: row[:type_id])
        .where('ABS(amount - ?) <= 2.00', amount)
        .first

      if probable.present?
        { index: i, match: { id: probable.id, amount: probable.amount, date: probable.date, note: probable.note, kind: 'probable' } }
      else
        possible_amount = Operation
          .where(date: possible_range)
          .where('ABS(amount - ?) <= 2.00', amount)
          .first

        if possible_amount.present?
          { index: i, match: { id: possible_amount.id, amount: possible_amount.amount, date: possible_amount.date, note: possible_amount.note, kind: 'possible' } }
        elsif row[:note].present?
          key = row[:note].to_s.split(/\s+/).select { |w| w.length >= 4 }.max_by(&:length)
          if key
            possible_note = Operation.where(date: possible_range).where('note LIKE ?', "%#{key}%").first
            possible_note && { index: i, match: { id: possible_note.id, amount: possible_note.amount, date: possible_note.date, note: possible_note.note, kind: 'possible' } }
          end
        end
      end
    end
    render json: matches
  end

  # POST /operations/extract.json
  def extract
    file = params.require(:file)
    base64_data = Base64.strict_encode64(file.read)
    type_names = Type.pluck(:name)
    raw = GeminiService.extract_transactions(base64_data, file.content_type, extract_prompt(type_names))
    transactions = JSON.parse(raw)
    render json: transactions
  rescue => e
    render json: { error: e.message }, status: :unprocessable_content
  end

  # POST /operations/bulk.json
  def bulk
    ops_params = params.require(:operations).map do |op|
      op.permit(:date, :sign, :amount, :type_id, :user_id, :note)
    end

    created = []
    ActiveRecord::Base.transaction do
      ops_params.each do |op|
        record = Operation.new(op)
        unless record.save
          render json: { errors: record.errors.full_messages }, status: :unprocessable_content
          raise ActiveRecord::Rollback
        end
        created << record
      end
    end

    return if performed?

    created.map(&:year).uniq.each do |year|
      ActionCable.server.broadcast 'operations', { method: 'bulk_create', year: year, max: Operation.where(year: year).maximum(:updated_at).to_i }
    end

    render json: {
      created: created.size,
      operations: created.map { |op|
        op.as_json(only: [:id, :date, :note, :amount, :sign],
                   include: { type: { only: [:name] }, user: { only: [:name] } })
      }
    }, status: :created
  end

  # POST /operations.json
  def create
    @operation = Operation.new(operation_params)
    respond_to do |format|
      if @operation.save
        operation = @operation.as_json(include: { type: { only: [:id, :name, :spending_roof, :spending_limit] }, user: { only: [:id, :name]} })
        ActionCable.server.broadcast 'operations', { message: operation, method: "create", max: @operation.updated_at.to_i, year: @operation.year }
        format.json { render :show, status: :created, location: @operation }
      else
        format.json { render json: @operation.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH/PUT /operations/1.json
  def update
    respond_to do |format|
      if @operation.update(operation_params)
        operation = @operation.as_json(include: { type: { only: [:id, :name, :spending_roof, :spending_limit] }, user: { only: [:id, :name]} })
        ActionCable.server.broadcast 'operations', { message: operation, method: "update", max: @operation.updated_at.to_i, year: @operation.year }
        format.json { render :show, status: :ok, location: @operation }
      else
        format.json { render json: @operation.errors, status: :unprocessable_content }
      end
    end
  end

  # DELETE /operations/1.json
  def destroy
    @operation.destroy
    operation = @operation.as_json(include: { type: { only: :name }, user: { only: :name} })
    last_operation = Operation.where(year: @operation.year).last
    last_operation.update(updated_at: Time.now)
    ActionCable.server.broadcast 'operations', { message: operation, method: "destroy", max: last_operation.updated_at.to_i, year: @operation.year }
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_operation
      @operation = Operation.find(params[:id])
    end

    def extract_prompt(type_names)
      types_list = type_names.map { |n| "  - #{n}" }.join("\n")
      <<~PROMPT
        Extract all financial transactions from this bank statement image or document.
        Return ONLY a JSON array, no explanation, no markdown fences.
        Each element must have exactly these fields:
        - "date": string in YYYY-MM-DD format
        - "note": string, the transaction description or merchant name (keep it short, max 40 chars)
        - "amount": string, positive number without currency symbol (e.g. "42.50")
        - "sign": "+" for income/credit, "-" for expense/debit
        - "kind": classify each row as exactly one of:
            "operation"  — regular income or expense
            "withdrawal" — cash withdrawal from ATM or bank teller
            "skip"       — internal transfer between own accounts, account balance rows, bank fees
        - "type_name": for kind="operation" only, the single best-matching category from the list
          below (use the exact name as written), or null if nothing fits:
        #{types_list}

        Rules:
        - Omit rows where kind="skip" entirely — do not include them in the output.
        - For kind="withdrawal": sign must be "-", type_name must be null.
        - For kind="operation": infer sign from context (debits are "-", credits are "+").

        Example: [{"date":"2024-01-15","note":"Esselunga","amount":"42.50","sign":"-","kind":"operation","type_name":"Spesa alimentare"}]
      PROMPT
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def operation_params
      params.require(:operation).permit(:note, :date, :sign, :amount, :type_id, :user_id, :repeat, :interval_repeat, :type_repeat, :week_repeat, :wday_repeat, :last_date_repeat, :day_of_month_repeat)
    end
end
