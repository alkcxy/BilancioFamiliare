# == Schema Information
#
# Table name: withdrawals
#
#  id         :integer          not null, primary key
#  amount     :decimal(12, 2)   not null
#  date       :date             not null
#  note       :string
#  year       :integer          not null
#  month      :integer          not null
#  day        :integer          not null
#  user_id    :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Withdrawal < ApplicationRecord
  belongs_to :user, touch: true

  validates :note, length: { maximum: 4000 }, presence: false
  validates :amount, presence: true
  validates :user_id, presence: true
  validates :date, presence: true

  before_save do
     self.year = date.year
     self.month = date.month
     self.day = date.day
   end
end
