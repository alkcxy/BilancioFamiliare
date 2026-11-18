require 'test_helper'

class CategorizationHistoryTest < ActiveSupport::TestCase
  setup do
    Operation.delete_all
    @user = users(:one)
  end

  def create_op(note, type, date: 1.month.ago.to_date)
    Operation.create!(date: date, sign: '-', amount: 10.0, note: note, type: type, user: @user)
  end

  test "mapping returns normalized note to most frequent type name" do
    create_op('ESSELUNGA  ROMA', types(:one))
    create_op('esselunga roma', types(:one))
    create_op('Barilla Store', types(:two), date: 2.months.ago.to_date)

    mapping = CategorizationHistory.mapping

    assert_equal({ 'esselunga roma' => 'MyString', 'barilla store' => 'MyString' }, mapping)
  end

  test "mapping picks the majority type when a note has multiple types" do
    create_op('Poste Italiane', types(:one))
    create_op('poste  italiane', types(:one))
    create_op('POSTE ITALIANE', types(:two))

    mapping = CategorizationHistory.mapping

    assert_equal types(:one).name, mapping['poste italiane']
  end

  test "mapping ignores blank notes" do
    create_op(nil, types(:one))
    create_op('   ', types(:one))

    assert_empty CategorizationHistory.mapping
  end

  test "mapping is empty when there are no operations" do
    assert_empty CategorizationHistory.mapping
  end

  test "mapping only considers recent operations" do
    create_op('Old Shop', types(:one), date: 3.years.ago)
    create_op('New Shop', types(:one), date: 1.month.ago)

    mapping = CategorizationHistory.mapping

    assert_equal({ 'new shop' => 'MyString' }, mapping)
  end
end
