require 'test_helper'

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @headers = auth_headers(@user)
  end

  test "should get index" do
    get users_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_user_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should create user" do
    assert_difference('User.count') do
      post users_path, params: { user: { blocked: @user.blocked, email: "ciccio@ciccio.it", name: @user.name, password: "abcdefghi", password_confirmation: "abcdefghi" } }, headers: @headers, as: :json
    end

    assert_response :created
  end

  test "should show user" do
    get user_path(id: @user.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_user_path(id: @user.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should update user" do
    patch user_path(id: @user.id), params: { user: { blocked: @user.blocked, email: @user.email, name: @user.name, password_digest: @user.password_digest } }, headers: @headers, as: :json
    assert_response :success
  end

  test "should destroy user" do
    assert_raises do
      delete user_path(id: @user.id), headers: @headers, as: :json
    end
  end

  test "should return 401 without auth token" do
    get users_path, as: :json
    assert_response :unauthorized
  end

  test "create with invalid params returns unprocessable entity" do
    post users_path, params: { user: { name: nil, email: nil, password: 'x' } }, headers: @headers, as: :json
    assert_response :unprocessable_content
  end

  test "update with invalid params returns unprocessable entity" do
    patch user_path(id: @user.id), params: { user: { name: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_content
  end

  test "show response contains expected fields" do
    get user_path(id: @user.id), headers: @headers, as: :json
    json = JSON.parse(response.body)
    %w[id name email blocked url].each { |f| assert json.key?(f), "missing field: #{f}" }
  end
end
