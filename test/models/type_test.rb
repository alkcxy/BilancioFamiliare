# == Schema Information
#
# Table name: types
#
#  id             :integer          not null, primary key
#  name           :string           not null
#  description    :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  master_type_id :integer
#

require 'test_helper'

class TypeTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
