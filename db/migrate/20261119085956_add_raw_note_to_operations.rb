class AddRawNoteToOperations < ActiveRecord::Migration[8.1]
  def change
    add_column :operations, :raw_note, :text
  end
end
