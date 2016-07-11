# == Schema Information
#
# Table name: types
#
#  id          :integer          not null, primary key
#  name        :string           not null
#  description :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#

class Type < ApplicationRecord
  validates :name, presence: true, length: { maximum: 70 }, allow_nil: false
  validates :description, length: { maximum: 4000 }, allow_nil: true, presence: false

  has_many :operations
  has_many :synonyms, class_name: self.name, foreign_key: "master_type_id"
  belongs_to :"master_type", class_name: self.name

  scope :of_the_year, lambda { |year| joins(:operations).where(operations: { year: year }).order("name ASC").distinct(:name) }

  before_save do
    self.master_type_id ||= id
    true
  end

end
