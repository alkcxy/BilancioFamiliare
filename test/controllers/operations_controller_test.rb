require 'test_helper'

class OperationsControllerTest < ActionDispatch::IntegrationTest
  include ActionCable::TestHelper

  setup do
    @operation = operations(:one)
    @user = users(:one)
    @headers = auth_headers(@user)
  end

  test "should get index" do
    get operations_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_operation_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should create operation" do
    assert_difference('Operation.count') do
      post operations_path, params: { operation: { amount: @operation.amount, date: @operation.date, sign: @operation.sign, type_id: @operation.type_id, user_id: @user.id } }, headers: @headers, as: :json
    end

    assert_response :created
  end

  test "should show operation" do
    get operation_path(id: @operation.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_operation_path(id: @operation.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should update operation" do
    patch operation_path(id: @operation.id), params: { operation: { amount: @operation.amount, date: @operation.date, type_id: @operation.type_id } }, headers: @headers, as: :json
    assert_response :success
  end

  test "should destroy operation" do
    assert_difference('Operation.count', -1) do
      delete operation_path(id: @operation.id), headers: @headers, as: :json
    end

    assert_response :no_content
  end

  test "should get max" do
    get max_operations_path, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_kind_of Array, json
  end

  test "should get calendar_month" do
    get calendar_month_operations_path(year: @operation.year, month: @operation.month), headers: @headers, as: :json
    assert_response :success
  end

  test "should get calendar_year" do
    get calendar_year_operations_path(year: @operation.year), headers: @headers, as: :json
    assert_response :success
  end

  test "index filters by year" do
    get operations_path(year: @operation.year), headers: @headers, as: :json
    assert_response :success
  end

  test "index filters by month" do
    get operations_path(year: @operation.year, month: @operation.month), headers: @headers, as: :json
    assert_response :success
  end

  test "index filters by type_id" do
    get operations_path(type_id: @operation.type_id), headers: @headers, as: :json
    assert_response :success
  end

  test "index filters by search query" do
    get operations_path(q: "300"), headers: @headers, as: :json
    assert_response :success
  end

  test "should return 401 without auth token" do
    get operations_path, as: :json
    assert_response :unauthorized
  end

  test "create with invalid params returns unprocessable entity" do
    post operations_path, params: { operation: { amount: nil, date: nil, sign: nil, type_id: nil, user_id: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
  end

  test "update with invalid params returns unprocessable entity" do
    patch operation_path(id: @operation.id), params: { operation: { amount: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
  end

  test "show response contains expected fields" do
    get operation_path(id: @operation.id), headers: @headers, as: :json
    json = JSON.parse(response.body)
    %w[id amount sign type_id user_id date year month day type user url].each { |f| assert json.key?(f), "missing field: #{f}" }
    assert json["type"].key?("id")
    assert json["type"].key?("name")
    assert json["user"].key?("id")
    assert json["user"].key?("name")
  end

  test "create broadcasts to operations channel" do
    assert_broadcasts('operations', 1) do
      post operations_path, params: { operation: { amount: @operation.amount, date: @operation.date, sign: @operation.sign, type_id: @operation.type_id, user_id: @user.id } }, headers: @headers, as: :json
    end
  end

  test "update broadcasts to operations channel" do
    assert_broadcasts('operations', 1) do
      patch operation_path(id: @operation.id), params: { operation: { amount: @operation.amount, date: @operation.date, type_id: @operation.type_id } }, headers: @headers, as: :json
    end
  end

  test "destroy broadcasts to operations channel" do
    assert_broadcasts('operations', 1) do
      delete operation_path(id: @operation.id), headers: @headers, as: :json
    end
  end
end
