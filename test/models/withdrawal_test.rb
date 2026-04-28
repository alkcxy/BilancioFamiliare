require 'test_helper'

class WithdrawalTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
  end

  test "valid withdrawal" do
    w = Withdrawal.new(amount: 100, date: Date.today, user: @user)
    assert w.valid?
  end

  test "invalid without amount" do
    w = Withdrawal.new(amount: nil, date: Date.today, user: @user)
    assert_not w.valid?
    assert w.errors[:amount].any?
  end

  test "invalid without date" do
    w = Withdrawal.new(amount: 100, date: nil, user: @user)
    assert_not w.valid?
    assert w.errors[:date].any?
  end

  test "invalid without user" do
    w = Withdrawal.new(amount: 100, date: Date.today, user_id: nil)
    assert_not w.valid?
    assert w.errors[:user_id].any?
  end

  test "note max length is 4000" do
    w = Withdrawal.new(amount: 100, date: Date.today, user: @user, note: "x" * 4001)
    assert_not w.valid?
    assert w.errors[:note].any?
  end

  test "extracts date components before save" do
    date = Date.new(2023, 7, 20)
    w = Withdrawal.create!(amount: 50, date: date, user: @user)
    assert_equal 2023, w.year
    assert_equal 7, w.month
    assert_equal 20, w.day
  end

  test "belongs to user" do
    w = withdrawals(:one)
    assert_kind_of User, w.user
  end
end
