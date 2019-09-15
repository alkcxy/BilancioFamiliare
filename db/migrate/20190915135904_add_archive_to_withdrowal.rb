class AddArchiveToWithdrowal < ActiveRecord::Migration[5.2]
  def change
    add_column :withdrawals, :archive, :boolean, default: false
  end
end
