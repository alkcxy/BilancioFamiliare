require 'test_helper'

class TypesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @type = types(:one)
  end

  test "should get index" do
    get types_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_type_path, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should create type" do
    assert_difference('Type.count') do
      post types_path, params: { type: { description: @type.description, name: @type.name } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :created
  end

  test "should show type" do
    get type_path(id: @type.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_type_path(id: @type.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should update type" do
    patch type_path(id: @type.id), params: { type: { description: @type.description, name: @type.name } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should destroy type" do
    assert_difference('Type.count', -1) do
      delete type_path(id: @type.id), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :no_content
  end
end
