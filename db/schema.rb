# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20160620144842) do

  create_table "operations", force: :cascade do |t|
    t.string   "note"
    t.string   "sign",                                null: false
    t.decimal  "amount",     precision: 12, scale: 2, null: false
    t.integer  "type_id",                             null: false
    t.integer  "user_id",                             null: false
    t.date     "date",                                null: false
    t.integer  "year",                                null: false
    t.integer  "month",                               null: false
    t.integer  "day",                                 null: false
    t.datetime "created_at",                          null: false
    t.datetime "updated_at",                          null: false
    t.index ["day"], name: "index_operations_on_day"
    t.index ["month"], name: "index_operations_on_month"
    t.index ["sign"], name: "index_operations_on_sign"
    t.index ["type_id"], name: "index_operations_on_type_id"
    t.index ["user_id"], name: "index_operations_on_user_id"
    t.index ["year"], name: "index_operations_on_year"
  end

  create_table "types", force: :cascade do |t|
    t.string   "name",        null: false
    t.string   "description"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.index ["name"], name: "index_types_on_name"
  end

  create_table "users", force: :cascade do |t|
    t.string   "name",                            null: false
    t.string   "email",                           null: false
    t.string   "password_digest",                 null: false
    t.boolean  "blocked",         default: false, null: false
    t.datetime "created_at",                      null: false
    t.datetime "updated_at",                      null: false
  end

end
