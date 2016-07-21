# == Schema Information
#
# Table name: operations
#
#  id         :integer          not null, primary key
#  note       :string
#  sign       :string           not null
#  amount     :decimal(12, 2)   not null
#  type_id    :integer          not null
#  user_id    :integer          not null
#  date       :date             not null
#  year       :integer          not null
#  month      :integer          not null
#  day        :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

require 'test_helper'

class OperationTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
