class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  #protect_from_forgery with: :exception

  private
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
  helper_method :current_user

  def authorize
    redirect_to '/login' unless current_user
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
