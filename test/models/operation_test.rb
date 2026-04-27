require 'test_helper'

class OperationTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @type = types(:one)
  end

  test "valid operation" do
    op = Operation.new(
      amount: 100,
      date: Date.today,
      sign: '+',
      user: @user,
      type: @type
    )
    assert op.valid?
  end

  test "invalid without amount" do
    op = Operation.new(amount: nil)
    assert_not op.valid?
    assert op.errors[:amount].any?
  end

  test "extracts date components before save" do
    date = Date.new(2023, 5, 15)
    op = Operation.create!(
      amount: 50,
      date: date,
      sign: '-',
      user: @user,
      type: @type
    )
    assert_equal 2023, op.year
    assert_equal 5, op.month
    assert_equal 15, op.day
  end

  test "scope by_month" do
    Operation.create!(amount: 10, date: Date.new(2023, 1, 1), sign: '+', user: @user, type: @type)
    Operation.create!(amount: 20, date: Date.new(2023, 1, 15), sign: '+', user: @user, type: @type)
    Operation.create!(amount: 30, date: Date.new(2023, 2, 1), sign: '+', user: @user, type: @type)
    
    assert_equal 2, Operation.by_month(2023, 1).count
    assert_equal 1, Operation.by_month(2023, 2).count
  end
end
