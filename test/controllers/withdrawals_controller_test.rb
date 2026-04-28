require 'test_helper'

class WithdrawalsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @withdrawal = withdrawals(:one)
    @user = users(:one)
    @headers = auth_headers(@user)
  end

  test "should get index" do
    get withdrawals_url, headers: @headers, as: :json
    assert_response :success
  end

  test "should get new" do
    get new_withdrawal_url, headers: @headers, as: :json
    assert_response :success
  end

  test "should create withdrawal" do
    assert_difference('Withdrawal.count') do
      post withdrawals_url, params: { withdrawal: { amount: @withdrawal.amount, date: @withdrawal.date, user_id: @user.id } }, headers: @headers, as: :json
    end

    assert_response :created
  end

  test "should show withdrawal" do
    get withdrawal_url(@withdrawal), headers: @headers, as: :json
    assert_response :success
  end

  test "should get edit" do
    get edit_withdrawal_url(@withdrawal), headers: @headers, as: :json
    assert_response :success
  end

  test "should update withdrawal" do
    patch withdrawal_url(@withdrawal), params: { withdrawal: { amount: @withdrawal.amount, date: @withdrawal.date } }, headers: @headers, as: :json
    assert_response :success
  end

  test "should destroy withdrawal" do
    assert_difference('Withdrawal.count', -1) do
      delete withdrawal_url(@withdrawal), headers: @headers, as: :json
    end

    assert_response :no_content
  end

  test "should get all withdrawals" do
    get all_withdrawals_path, headers: @headers, as: :json
    assert_response :success
  end

  test "should get archive withdrawals" do
    get archive_withdrawals_path, headers: @headers, as: :json
    assert_response :success
  end

  test "create with invalid params returns unprocessable entity" do
    post withdrawals_url, params: { withdrawal: { amount: nil, date: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_content
  end

  test "update with invalid params returns unprocessable entity" do
    patch withdrawal_url(@withdrawal), params: { withdrawal: { amount: nil } }, headers: @headers, as: :json
    assert_response :unprocessable_content
  end

  test "should return 401 without auth token" do
    get withdrawals_url, as: :json
    assert_response :unauthorized
  end

  test "show response contains expected fields" do
    get withdrawal_url(@withdrawal), headers: @headers, as: :json
    json = JSON.parse(response.body)
    %w[id amount date user_id year month day user url].each { |f| assert json.key?(f), "missing field: #{f}" }
    assert json["user"].key?("id")
    assert json["user"].key?("name")
  end

  test "check_duplicates returns match for exact amount and date" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert_equal @withdrawal.id, json[0]['match']['id']
    assert json[0]['match'].key?('note')
  end

  test "check_duplicates returns match within 0.02 tolerance" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount.to_f + 0.01 }]
    }, headers: @headers, as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body).length
  end

  test "check_duplicates returns empty when amount differs by more than 0.02" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount.to_f + 0.03 }]
    }, headers: @headers, as: :json
    assert_response :success
    assert_empty JSON.parse(response.body)
  end

  test "check_duplicates matches by similar note on same date" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: 9999, note: 'clacla' }]
    }, headers: @headers, as: :json
    assert_response :success
    assert_equal 1, JSON.parse(response.body).length
  end
end
