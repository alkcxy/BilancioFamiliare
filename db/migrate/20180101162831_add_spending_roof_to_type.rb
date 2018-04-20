class AddSpendingRoofToType < ActiveRecord::Migration[5.1]
  def change
    add_column :types, :spending_roof, :decimal, precision: 12, scale: 2, null: true
  end
end
