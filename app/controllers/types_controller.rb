class TypesController < ApplicationController
  before_action :set_type, only: [:show, :edit, :update, :destroy]
  before_action :types_list, only: [:index, :new, :create, :edit, :update]
  before_action :authorize

  # GET /types
  # GET /types.json
  def index
  end

  # GET /types/1
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

  # POST /types
  # POST /types.json
  def create
    @type = Type.new(type_params)

    respond_to do |format|
      if @type.save
        format.html { redirect_to @type, notice: 'Type was successfully created.' }
        format.json { render :show, status: :created, location: @type }
      else
        format.html { render :new }
        format.json { render json: @type.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /types/1
  # PATCH/PUT /types/1.json
  def update
    respond_to do |format|
      Rails.logger.info "type_params"
      Rails.logger.info type_params
      if @type.update(type_params)
        @type.operations.update_all(updated_at: Time.now)
        operations = @type.operations.as_json(include: { type: { only: [:id, :name, :spending_roof] }, user: { only: [:id, :name]} })
        ActionCable.server.broadcast 'operations', message: operations, method: "update", max: Operation.maximum(:updated_at).to_i
        format.html { redirect_to @type, notice: 'Type was successfully updated.' }
        format.json { render :show, status: :ok, location: @type }
      else
        format.html { render :edit }
        format.json { render json: @type.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /types/1
  # DELETE /types/1.json
  def destroy
    operations = @type.operations.as_json(only: :id)
    @type.destroy
    Operation.last.update(updated_at: Time.now)
    ActionCable.server.broadcast 'operations', message: operations, method: "destroy", max: Operation.maximum(:updated_at).to_i
    respond_to do |format|
      format.html { redirect_to types_url, notice: 'Type was successfully destroyed.' }
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
      params.require(:type).permit(:name, :description, :master_type_id, :spending_roof)
    end

    def types_list
      @types = Type.order("name ASC").includes(:master_type)
    end
end
