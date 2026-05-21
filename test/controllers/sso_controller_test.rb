require 'test_helper'

class SsoControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  def authelia_headers(email: @user.email)
    {
      'Remote-Email' => email,
      'Remote-User'  => 'userone',
      'Remote-Name'  => @user.name
    }
  end

  test "returns 404 when authelia_enabled is false" do
    Rails.application.config.bilancio[:authelia_enabled] = false
    get '/auth/sso', headers: authelia_headers, as: :json
    assert_response :not_found
  ensure
    Rails.application.config.bilancio[:authelia_enabled] = true
  end

  test "returns 400 when Remote-Email header is missing" do
    get '/auth/sso', as: :json
    assert_response :bad_request
  end

  test "returns 403 when email does not match any user" do
    get '/auth/sso', headers: authelia_headers(email: 'nobody@example.com'), as: :json
    assert_response :forbidden
  end

  test "returns 403 when user is blocked" do
    blocked = User.create!(name: 'Blocked', email: 'blocked@example.com',
                           password: 'password123', password_confirmation: 'password123',
                           blocked: true)
    get '/auth/sso', headers: authelia_headers(email: blocked.email), as: :json
    assert_response :forbidden
  end

  test "returns token for valid Authelia headers" do
    get '/auth/sso', headers: authelia_headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal true, json['status']
    assert json['token'].present?
  end

  test "token contains correct user data" do
    get '/auth/sso', headers: authelia_headers, as: :json
    json = JSON.parse(response.body)
    payload, _ = JWT.decode(
      json['token'],
      Rails.application.config.bilancio[:token_key_base],
      true,
      { algorithm: 'HS512' }
    )
    assert_equal @user.id,    payload['user']['id']
    assert_equal @user.email, payload['user']['email']
    assert_equal @user.name,  payload['user']['name']
  end

  test "SSO endpoint is accessible without prior JWT auth" do
    get '/auth/sso', headers: authelia_headers, as: :json
    assert_response :success
  end
end
