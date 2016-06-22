class CreateUsers < ActiveRecord::Migration[5.0]
  def change
    create_table :users do |t|
      t.string :name, null: false, index: true
      t.string :email, null: false, index: true, unique: true
      t.string :password_digest, null: false
      t.boolean :blocked, default: false, null: false

      t.timestamps
    end
  end
end
