class CreateOperations < ActiveRecord::Migration[5.0]
  def change
    create_table :operations do |t|
      t.string :note, length: 4000
      t.date :date
      t.decimal :amount, precision: 12, scale: 2
      t.references :type, foreign_key: true
      t.references :user, foreign_key: true

      t.timestamps
    end
  end
end
