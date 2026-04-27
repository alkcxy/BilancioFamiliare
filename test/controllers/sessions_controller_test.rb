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
    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert json["error_msg"].present?
  end

  test "login with nonexistent email returns unprocessable entity" do
    post login_path, params: { email: 'nobody@example.com', password: 'password' }, as: :json
    assert_response :unprocessable_entity
  end
end
