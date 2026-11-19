require 'test_helper'

class CategorizationHistoryTest < ActiveSupport::TestCase
  setup do
    Operation.delete_all
    @user = users(:one)
  end

  def create_op(note, type, date: 1.month.ago.to_date, raw_note: nil)
    Operation.create!(date: date, sign: '-', amount: 10.0, note: note, raw_note: raw_note, type: type, user: @user)
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

  test "mapping is capped at 200 entries" do
    205.times { |i| create_op("Shop #{i}", types(:one)) }

    assert_equal 200, CategorizationHistory.mapping.size
  end

  test "patterns maps significant tokens to the most frequent type" do
    create_op('Esselunga Roma Nord', types(:one))
    create_op('ESSELUNGA  centro', types(:one))
    create_op('Esselunga', types(:two))
    create_op('Barilla Store', types(:two))

    patterns = CategorizationHistory.patterns

    assert_equal types(:one).name, patterns['esselunga']
    assert_equal types(:two).name, patterns['barilla']
    assert_equal types(:one).name, patterns['roma']
  end

  test "patterns ignores short tokens" do
    create_op('Bar 12 Milano', types(:one))

    assert_nil CategorizationHistory.patterns['bar']
    assert_equal types(:one).name, CategorizationHistory.patterns['milano']
  end

  test "mapping uses the original statement description (raw_note) instead of the edited note" do
    create_op('Spesa settimanale', types(:one), raw_note: 'ESSELUNGA ROMA 12345')

    mapping = CategorizationHistory.mapping

    assert_equal({ 'esselunga roma 12345' => 'MyString' }, mapping)
  end

  test "mapping falls back to note when raw_note is blank" do
    create_op('ESSELUNGA ROMA', types(:one), raw_note: '')
    create_op('Barilla Store', types(:two), raw_note: nil)

    mapping = CategorizationHistory.mapping

    assert_equal types(:one).name, mapping['esselunga roma']
    assert_equal types(:two).name, mapping['barilla store']
  end

  test "patterns use raw_note when present" do
    create_op('Spesa', types(:one), raw_note: 'COOP MILANO')

    patterns = CategorizationHistory.patterns

    assert_equal types(:one).name, patterns['coop']
    assert_not patterns.key?('spesa')
  end

  test "patterns is capped at 100 entries" do
    120.times { |i| create_op("Merchant#{i} Shop", types(:one)) }

    assert_equal 100, CategorizationHistory.patterns.size
  end
end
