require 'test_helper'

class OperationsControllerTest < ActionController::TestCase
  setup do
    @operation = operations(:one)
  end

  test "should get index" do
    get :index, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get new" do
    get :new, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should create operation" do
    assert_difference('Operation.count') do
      post :create, params: { operation: { amount: @operation.amount, date: @operation.date, sign: @operation.sign, type_id: @operation.type_id, user_id: @operation.user_id } }, session: { user_id: User.first.id }
    end

    assert_redirected_to operation_path(Operation.last)
  end

  test "should show operation" do
    get :show, params: { id: @operation.id }, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should get edit" do
    get :edit, params: { id: @operation.id }, session: { user_id: User.first.id }
    assert_response :success
  end

  test "should update operation" do
    patch :update, params: { id: @operation.id, operation: { amount: @operation.amount, date: @operation.date, type_id: @operation.type_id } }, session: { user_id: User.first.id }
    assert_redirected_to operation_path(@operation)
  end

  test "should destroy operation" do
    assert_difference('Operation.count', -1) do
      delete :destroy, params: { id: @operation.id }, session: { user_id: User.first.id }
    end

    assert_redirected_to operations_path
  end
end
