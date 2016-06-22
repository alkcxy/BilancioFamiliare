class CreateOperations < ActiveRecord::Migration[5.0]
  def change
    create_table :operations do |t|
      t.string :note, length: 4000
      t.string :sign, length: 1, index: true, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.references :type, foreign_key: true, null: false
      t.references :user, foreign_key: true, null: false
      t.date :date, null: false
      t.integer :year, precision: 4, index: true, null: false
      t.integer :month, precision: 2, index: true, null: false
      t.integer :day, precision: 2, index: true, null: false

      t.timestamps
    end
  end
end
