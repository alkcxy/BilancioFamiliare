class AddSpendingLimitToType < ActiveRecord::Migration[5.2]
  def change
    add_column :types, :spending_limit, :json, null: true
  end
end
