require 'test_helper'

class TypesControllerTest < ActionController::TestCase
  setup do
    @type = types(:one)
  end

  test "should get index" do
    get :index, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get new" do
    get :new, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should create type" do
    assert_difference('Type.count') do
      post :create, params: { type: { description: @type.description, name: @type.name } }, session:  { user_id: User.first.id }
    end

    assert_redirected_to type_path(Type.last)
  end

  test "should show type" do
    get :show, params: { id: @type.id }, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get edit" do
    get :edit, params: { id: @type.id }, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should update type" do
    patch :update, params: { id: @type.id, type: { description: @type.description, name: @type.name } }, session: { user_id: User.first.id }
    assert_redirected_to type_path(@type)
  end

  test "should destroy type" do
    assert_difference('Type.count', -1) do
      delete :destroy, params: { id: @type.id }, session: { user_id: User.first.id }
    end

    assert_redirected_to types_path
  end
end
