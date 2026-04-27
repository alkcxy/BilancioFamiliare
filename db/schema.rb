# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2019_09_15_135904) do
  create_table "operations", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.text "note"
    t.string "sign", null: false
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.integer "type_id", null: false
    t.integer "user_id", null: false
    t.date "date", null: false
    t.integer "year", null: false
    t.integer "month", null: false
    t.integer "day", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["day"], name: "index_operations_on_day"
    t.index ["month"], name: "index_operations_on_month"
    t.index ["sign"], name: "index_operations_on_sign", length: 191
    t.index ["type_id"], name: "index_operations_on_type_id"
    t.index ["user_id"], name: "index_operations_on_user_id"
    t.index ["year"], name: "index_operations_on_year"
  end

  create_table "types", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "description"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "master_type_id"
    t.decimal "spending_roof", precision: 12, scale: 2
    t.text "spending_limit", size: :long, collation: "utf8mb4_bin"
    t.index ["name"], name: "index_types_on_name", length: 191
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.boolean "blocked", default: false, null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["email"], name: "index_users_on_email", length: 191
    t.index ["name"], name: "index_users_on_name", length: 191
  end

  create_table "withdrawals", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, null: false
    t.date "date", null: false
    t.text "note"
    t.integer "year", null: false
    t.integer "month", null: false
    t.integer "day", null: false
    t.integer "user_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.boolean "complete", default: false
    t.boolean "archive", default: false
    t.index ["day"], name: "index_withdrawals_on_day"
    t.index ["month"], name: "index_withdrawals_on_month"
    t.index ["user_id"], name: "index_withdrawals_on_user_id"
    t.index ["year"], name: "index_withdrawals_on_year"
  end
end
