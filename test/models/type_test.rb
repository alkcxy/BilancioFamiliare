require 'test_helper'

class TypeTest < ActiveSupport::TestCase
  test "valid type" do
    type = Type.new(name: "Grocery")
    assert type.valid?
  end

  test "invalid without name" do
    type = Type.new(name: nil)
    assert_not type.valid?
    assert type.errors[:name].any?
  end

  test "name max length is 70" do
    type = Type.new(name: "a" * 71)
    assert_not type.valid?
    assert type.errors[:name].any?
  end

  test "description max length is 4000" do
    type = Type.new(name: "Valid", description: "x" * 4001)
    assert_not type.valid?
    assert type.errors[:description].any?
  end

  test "after_save sets master_type_id to self when blank" do
    type = Type.create!(name: "Standalone Type")
    assert_equal type.id, type.master_type_id
  end

  test "master_type_id is preserved when explicitly set" do
    master = types(:one)
    child = Type.create!(name: "Child Type", master_type_id: master.id)
    assert_equal master.id, child.master_type_id
  end

  test "has many synonyms" do
    master = types(:one)
    assert_respond_to master, :synonyms
    assert_kind_of Type, master.synonyms.first
  end

  test "belongs to master_type" do
    child = types(:two)
    assert_respond_to child, :master_type
  end

  test "has many operations" do
    type = types(:one)
    assert_respond_to type, :operations
    assert type.operations.count >= 1
  end

  test "scope of_the_year returns types with operations in given year" do
    result = Type.of_the_year(2016)
    assert result.count >= 1
    result.each do |t|
      assert t.operations.where(year: 2016).exists?
    end
  end

  test "scope of_the_year_and_month returns types filtered by month" do
    result = Type.of_the_year_and_month(2016, 6)
    assert result.count >= 1
    result.each do |t|
      assert t.operations.where(year: 2016, month: 6).exists?
    end
  end
end
