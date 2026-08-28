require 'test_helper'

class RepeatableTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @type = types(:one)
  end

  test "broadcasts repeated operations with the type/user payload the frontend filters on" do
    payloads = []
    ActionCable.server.stub(:broadcast, ->(_stream, data) { payloads << data }) do
      Operation.create!(
        amount: 100, date: Date.new(2026, 1, 15), sign: '-', user: @user, type: @type,
        repeat: '1', interval_repeat: '1', type_repeat: '3',
        day_of_month_repeat: '15',
        last_date_repeat: '2026-03-15'
      )
    end

    assert_equal 2, payloads.size
    payloads.each do |data|
      assert_equal 2026, data[:year]
      assert_equal @type.id, data[:message]['type']['id']
      assert_equal @user.id, data[:message]['user']['id']
      assert_includes data[:message]['type'].keys, 'spending_roof'
      assert_equal 2026, data[:message]['year']
    end
  end

  test "generates correct dates for exact day of month" do
    start = Date.new(2026, 1, 15)
    before_ids = Operation.pluck(:id)
    Operation.create!(
      amount: 100, date: start, sign: '-', user: @user, type: @type,
      repeat: '1', interval_repeat: '1', type_repeat: '3',
      day_of_month_repeat: '15',
      last_date_repeat: '2026-07-15'
    )
    new_ops = Operation.where.not(id: before_ids).order(:date)
    assert_equal 7, new_ops.count
    new_ops.each { |op| assert_equal 15, op.day, "Expected day 15, got #{op.day} for #{op.date}" }
  end

  test "clamps to end of month when day does not exist" do
    start = Date.new(2026, 1, 31)
    before_ids = Operation.pluck(:id)
    Operation.create!(
      amount: 100, date: start, sign: '-', user: @user, type: @type,
      repeat: '1', interval_repeat: '1', type_repeat: '3',
      day_of_month_repeat: '31',
      last_date_repeat: '2026-03-31'
    )
    repeated = Operation.where.not(id: before_ids).where.not(date: start).order(:date)
    assert_equal 2, repeated.count
    assert_equal Date.new(2026, 2, 28), repeated.first.date
    assert_equal Date.new(2026, 3, 31), repeated.last.date
  end

  test "weekday-based monthly repeat still works" do
    # 2026-01-05 is a Monday (wday=1)
    start = Date.new(2026, 1, 5)
    before_ids = Operation.pluck(:id)
    Operation.create!(
      amount: 100, date: start, sign: '-', user: @user, type: @type,
      repeat: '1', interval_repeat: '1', type_repeat: '3',
      week_repeat: '1', wday_repeat: '1',
      last_date_repeat: '2026-03-31'
    )
    repeated = Operation.where.not(id: before_ids).where.not(date: start).order(:date)
    assert_equal 2, repeated.count
    repeated.each do |op|
      assert_equal 1, op.date.wday, "Expected Monday (wday=1), got #{op.date.wday} for #{op.date}"
      assert op.day <= 7, "Expected 1st week (day <= 7), got day #{op.day}"
    end
  end
end
