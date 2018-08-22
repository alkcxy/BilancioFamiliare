class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  #protect_from_forgery with: :exception

  private
  def hmac_secret
    @hmac_secret ||= Rails.application.secrets[:token_key_base]
  end

  def authorize
    respond_to do |format|
      format.json do
        Rails.logger.debug("PROVA")
        Rails.logger.debug(Rails.application.config.bilancio['permit_anonyms'])
        if Rails.application.config.bilancio['permit_anonyms'] == 'true'
          return
        end
        if request.headers["Authorization"].present?
          token = request.headers["Authorization"].split(' ').last
          begin
            # add leeway to ensure the token is still accepted
            @current_user ||= JWT.decode token, hmac_secret, true, { :exp_leeway => 30, :algorithm => 'HS512' }
          rescue JWT::ExpiredSignature
            render json: {error: 'Not Authorized' }, status: 401
          end
        end
        render json: {error: 'Not Authorized' }, status: 401 unless @current_user
      end
    end
  end

  def years
    @years ||= Operation.distinct('year').pluck(:year)
  end
  helper_method :years

  def months
    @months ||= Operation.distinct('month').pluck(:month)
  end
  helper_method :months

  def types
    @Type ||= Type.joins(:operations).distinct('id, name').pluck(:id, :name)
  end
  helper_method :types
end
