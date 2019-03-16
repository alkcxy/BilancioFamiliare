class TypesController < ApplicationController
  before_action :set_type, only: [:show, :edit, :update, :destroy]
  before_action :types_list, only: [:index, :new, :create, :edit, :update]
  before_action :authorize

  # GET /types.json
  def index
  end

  # GET /types/1.json
  def show
  end

  # GET /types/new
  def new
    @type = Type.new
  end

  # GET /types/1/edit
  def edit
  end

  # POST /types.json
  def create
    @type = Type.new(type_params)

    respond_to do |format|
      if @type.save
        format.json { render :show, status: :created, location: @type }
      else
        format.json { render json: @type.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /types/1.json
  def update
    respond_to do |format|
      if @type.update(type_params)
        updated_at = Time.now
        @type.operations.update_all(updated_at: updated_at)
        @type.operations.group(:year).select('max(id), year').each do |operation|
          operations = @type.operations.where(year: operation.year).as_json(include: { type: { only: [:id, :name, :spending_roof] }, user: { only: [:id, :name]} })
          ActionCable.server.broadcast 'operations', message: operations, method: "update", max: updated_at.to_i, year: operation.year
        end
        format.json { render :show, status: :ok, location: @type }
      else
        format.json { render json: @type.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /types/1.json
  def destroy
    updated_at = Time.now
    messages = []
    @type.operations.group(:year).select('max(id), year').each do |operation|
      operations = @type.operations.where(year: operation.year).as_json(only: :id)
      messages << {message: operations, method: "destroy", max: updated_at.to_i, year: operation.year}
    end
    @type.destroy
    Operation.last.update(updated_at: updated_at)
    messages.each do |message|
      ActionCable.server.broadcast 'operations', message
    end
    respond_to do |format|
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_type
      @type = Type.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def type_params
      params.require(:type).permit(:name, :description, :master_type_id, :spending_roof, :spending_limit)
    end

    def types_list
      @types = Type.order("name ASC").includes(:master_type)
    end
end
