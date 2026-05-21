class SsoController < ApplicationController
  def show
    unless Rails.application.config.bilancio[:authelia_enabled]
      render json: { error: 'SSO not enabled' }, status: :not_found and return
    end

    email = request.headers['Remote-Email']
    unless email.present?
      render json: { error: 'Missing Authelia headers' }, status: :bad_request and return
    end

    user = User.where(blocked: false).find_by(email: email)
    unless user
      render json: { error: 'Forbidden' }, status: :forbidden and return
    end

    token = JWT.encode(
      { user: { id: user.id, name: user.name, email: user.email } },
      hmac_secret,
      'HS512'
    )
    render json: { status: true, token: token }
  end
end
