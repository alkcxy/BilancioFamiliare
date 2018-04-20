require 'test_helper'

class OperationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @operation = operations(:one)
  end

  test "should get index" do
    get operations_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_operation_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should create operation" do
    assert_difference('Operation.count') do
      post operations_path, params: { operation: { amount: @operation.amount, date: @operation.date, sign: @operation.sign, type_id: @operation.type_id, user_id: @operation.user_id } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :created
  end

  test "should show operation" do
    get operation_path(id: @operation.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_operation_path(id: @operation.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should update operation" do
    patch operation_path(id: @operation.id), params: { operation: { amount: @operation.amount, date: @operation.date, type_id: @operation.type_id } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should destroy operation" do
    assert_difference('Operation.count', -1) do
      delete operation_path(id: @operation.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :no_content
  end
end
