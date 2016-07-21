require 'test_helper'

class UsersControllerTest < ActionController::TestCase
  setup do
    @user = users(:one)
  end

  test "should get index" do
    get :index, params: {}, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get new" do
    get :new, params: {}, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should create user" do
    assert_difference('User.count') do
      post :create, params: { user: { blocked: @user.blocked, email: "ciccio@ciccio.it", name: @user.name, password: "abcdefghi", password_confirmation: "abcdefghi" } }, session: { user_id: User.first.id }
    end

    assert_redirected_to user_path(User.last)
  end

  test "should show user" do
    get :show, params: { id: @user.id }, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get edit" do
    get :edit, params: {id: @user.id}, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should update user" do
    patch :update, params: { id: @user.id,  user: { blocked: @user.blocked, email: @user.email, name: @user.name, password_digest: @user.password_digest } }, session: { user_id: User.first.id }
    assert_redirected_to user_path(@user)
  end

  test "should destroy user" do
    assert_difference('User.count', -1) do
      delete :destroy, params: { id: @user.id }, session: { user_id: User.first.id }
    end

    assert_redirected_to users_path
  end
end
