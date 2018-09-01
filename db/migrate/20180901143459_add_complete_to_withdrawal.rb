class AddCompleteToWithdrawal < ActiveRecord::Migration[5.2]
  def change
    add_column :withdrawals, :complete, :boolean, default: false
  end
end
