class AddMasterToType < ActiveRecord::Migration[5.0]
  def change
    add_column :types, :master_type_id, :integer, index: true, null: true
  end
end
