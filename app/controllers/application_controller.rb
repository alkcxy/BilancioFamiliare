class ApplicationController < ActionController::Base
  skip_forgery_protection

  private
  def hmac_secret
    @hmac_secret ||= Rails.application.config.bilancio[:token_key_base]
  end

  def authorize
    return if User.count == 0
    if request.headers["Authorization"].present?
      token = request.headers["Authorization"].split(' ').last
      begin
        @current_user ||= JWT.decode token, hmac_secret, true, { exp_leeway: 30, algorithm: 'HS512' }
        User.where(blocked: false).find @current_user[0]["user"]["id"]
        return
      rescue JWT::ExpiredSignature, ActiveRecord::RecordNotFound
      end
    end
    render json: { error: 'Not Authorized' }, status: 401
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
