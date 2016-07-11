class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
  helper_method :current_user

  def authorize
    Type.where(master_type_id: nil).each do |type|
      type.master_type_id ||= type.id
      type.save(validate: false)
    end
    redirect_to '/login' unless current_user
  end
end
