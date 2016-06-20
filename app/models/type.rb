class Type < ApplicationRecord
  validates :name, presence: true, length: { maximum: 70 }, allow_nil: false
  validates :description, length: { maximum: 4000 }, allow_nil: false, presence: false
end
