require 'test_helper'

class TypesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @type = types(:one)
    @user = users(:one)
    @headers = auth_headers(@user)
  end

  test "should get index" do
    get types_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_type_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should create type" do
    assert_difference('Type.count') do
      post types_path, params: { type: { description: @type.description, name: @type.name } }, headers: @headers, as: :json
    end

    assert_response :created
  end

  test "should show type" do
    get type_path(id: @type.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_type_path(id: @type.id), headers: @headers, as: :json
    assert_response :success
  end

  test "should update type" do
    patch type_path(id: @type.id), params: { type: { description: @type.description, name: @type.name } }, headers: @headers, as: :json
    assert_response :success
  end

  test "should destroy type" do
    assert_difference('Type.count', -1) do
      delete type_path(id: @type.id), headers: @headers, as: :json
    end

    assert_response :no_content
  end

  test "should return 401 without auth token" do
    get types_path, as: :json
    assert_response :unauthorized
  end

  test "create with invalid params returns unprocessable entity" do
    post types_path, params: { type: { name: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
  end

  test "update with invalid params returns unprocessable entity" do
    patch type_path(id: @type.id), params: { type: { name: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_entity
  end
end
