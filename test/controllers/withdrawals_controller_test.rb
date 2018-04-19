require 'test_helper'

class WithdrawalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @withdrawal = withdrawals(:one)
  end

  test "should get index" do
    get withdrawals_url, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_withdrawal_url, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should create withdrawal" do
    assert_difference('Withdrawal.count') do
      post withdrawals_url, params: { withdrawal: { amount: @withdrawal.amount, date: @withdrawal.date, user_id: users(:one).id } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :created
  end

  test "should show withdrawal" do
    get withdrawal_url(@withdrawal), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_withdrawal_url(@withdrawal), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should update withdrawal" do
    patch withdrawal_url(@withdrawal), params: { withdrawal: { amount: @withdrawal.amount, date: @withdrawal.date } }, headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    assert_response :success
  end

  test "should destroy withdrawal" do
    assert_difference('Withdrawal.count', -1) do
      delete withdrawal_url(@withdrawal), headers: { authorization: "Bearer "+JWT.encode({user: {id: User.first.id, name: User.first.name, email: User.first.email}}, Rails.application.secrets[:token_key_base], 'HS512') }, as: :json
    end

    assert_response :no_content
  end
end
