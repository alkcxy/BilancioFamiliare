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

  test "check_duplicates returns kind=probable for amount within 2.00 on same date" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount.to_f + 1.50 }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].any? { |m| m['kind'] == 'probable' }
  end

  test "check_duplicates returns probable when date differs by 1 day and amount matches" do
    next_day = @withdrawal.date + 1.day
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: next_day, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].any? { |m| m['kind'] == 'probable' }
  end

  test "check_duplicates returns possible for exact amount when date differs by 2 days and no note" do
    two_days_later = @withdrawal.date + 2.days
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: two_days_later, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].any? { |m| m['kind'] == 'possible' }
  end

  test "check_duplicates returns only contextual when date differs by 3 or more days" do
    far_date = @withdrawal.date + 3.days
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: far_date, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].all? { |m| m['kind'] == 'contextual' }
  end

  test "check_duplicates returns only contextual when import date is before existing record" do
    prior_date = @withdrawal.date - 1.day
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: prior_date, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].all? { |m| m['kind'] == 'contextual' }
  end

  test "check_duplicates returns empty when amount differs by more than 2.00 and no note" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount.to_f + 3.00 }]
    }, headers: @headers, as: :json
    assert_response :success
    assert_empty JSON.parse(response.body)
  end

  test "check_duplicates matches by similar note and amount within 2.00 with kind=possible" do
    two_days_later = @withdrawal.date + 2.days
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: two_days_later, amount: @withdrawal.amount.to_f + 1.50, note: 'clacla' }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].any? { |m| m['kind'] == 'possible' }
    assert json[0]['matches'].first.key?('note')
  end

  test "check_duplicates returns only contextual when note matches but amount differs by more than 2.00" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: 9999, note: 'clacla' }]
    }, headers: @headers, as: :json
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal 1, json.length
    assert json[0]['matches'].all? { |m| m['kind'] == 'contextual' }
  end

  test "check_duplicates returns user_name in match response" do
    post check_duplicates_withdrawals_path, params: {
      rows: [{ date: @withdrawal.date, amount: @withdrawal.amount }]
    }, headers: @headers, as: :json
    json = JSON.parse(response.body)
    assert json[0]['matches'].first.key?('user_name')
    assert_not_nil json[0]['matches'].first['user_name']
  end
end
