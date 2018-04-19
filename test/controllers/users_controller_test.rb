require 'test_helper'

class UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "should get index" do
    get users_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_user_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should create user" do
    assert_difference('User.count') do
      post users_path, params: { user: { blocked: @user.blocked, email: "ciccio@ciccio.it", name: @user.name, password: "abcdefghi", password_confirmation: "abcdefghi" } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :created
  end

  test "should show user" do
    get user_path(id: @user.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_user_path(id: @user.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should update user" do
    patch user_path(id: @user.id), params: { user: { blocked: @user.blocked, email: @user.email, name: @user.name, password_digest: @user.password_digest } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  # test "should destroy user" do
  #   assert_raises do
  #     delete user_path(id: @user.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
  #   end
  # end
end
