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
end
