class CreateTypes < ActiveRecord::Migration[5.0]
  def change
    create_table :types do |t|
      t.string :name, length: 70, index: true, null: false
      t.string :description, length: 4000

      t.timestamps
    end
  end
end
