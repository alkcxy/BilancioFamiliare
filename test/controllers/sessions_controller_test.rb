require 'test_helper'

class SessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "login with valid credentials returns token" do
    post login_path, params: { email: @user.email, password: 'password' }, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert json["token"].present?
    assert_equal true, json["status"]
  end

  test "login with wrong password returns unprocessable entity" do
    post login_path, params: { email: @user.email, password: 'wrong' }, as: :json
    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert json["error_msg"].present?
  end

  test "login with nonexistent email returns unprocessable entity" do
    post login_path, params: { email: 'nobody@example.com', password: 'password' }, as: :json
    assert_response :unprocessable_content
  end

  test "login with blocked user returns unprocessable entity" do
    blocked = User.create!(name: "Blocked", email: "blocked@example.com", password: "password123", password_confirmation: "password123", blocked: true)
    post login_path, params: { email: blocked.email, password: 'password123' }, as: :json
    assert_response :unprocessable_content
  end

  test "token contains correct user data" do
    post login_path, params: { email: @user.email, password: 'password' }, as: :json
    json = JSON.parse(response.body)
    payload, _ = JWT.decode(json["token"], Rails.application.config.bilancio[:token_key_base], true, { algorithm: 'HS512' })
    assert_equal @user.id, payload["user"]["id"]
    assert_equal @user.email, payload["user"]["email"]
    assert_equal @user.name, payload["user"]["name"]
  end

  test "expired token returns 401" do
    expired_token = JWT.encode(
      { user: { id: @user.id, name: @user.name, email: @user.email }, exp: 1.hour.ago.to_i },
      Rails.application.config.bilancio[:token_key_base],
      'HS512'
    )
    get operations_path, headers: { authorization: "Bearer #{expired_token}" }, as: :json
    assert_response :unauthorized
  end
end
