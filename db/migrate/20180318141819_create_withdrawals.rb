class CreateWithdrawals < ActiveRecord::Migration[5.1]
  def change
    create_table :withdrawals do |t|
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.date :date, null: false
      t.string :note, length: 4000
      t.integer :year, precision: 4, index: true, null: false
      t.integer :month, precision: 2, index: true, null: false
      t.integer :day, precision: 2, index: true, null: false
      t.references :user, foreign_key: true, null: false

      t.timestamps
    end
  end
end
