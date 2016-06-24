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
end
