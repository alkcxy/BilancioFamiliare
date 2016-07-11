# == Schema Information
#
# Table name: operations
#
#  id         :integer          not null, primary key
#  note       :string
#  sign       :string           not null
#  amount     :decimal(12, 2)   not null
#  type_id    :integer          not null
#  user_id    :integer
#  date       :date             not null
#  year       :integer          not null
#  month      :integer          not null
#  day        :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Operation < ApplicationRecord
  include Repeatable
  set_start_date :date
  belongs_to :type, touch: true
  belongs_to :user

  validates :note, length: { maximum: 4000 }, presence: false
  validates :sign, presence: true
  validates :amount, presence: true
  validates :type_id, presence: true
  validates :user_id, presence: true
  validates :date, presence: true

  scope :by_month_and_type, lambda { |year, month| joins(:type, :user).order("types.name ASC").group("types.name").where(year: year, month: month) }

  scope :by_month_and_sign, lambda { |year, month, sign| joins(:type, :user).where(year: year, month: month, sign: sign).order("types.name ASC, users.name ASC, operations.day ASC") }

  scope :tot_operations_per_type_per_year, lambda { | year| select("*, sum(amount) sum_amount, master_types_types.name types_name").joins(:type).merge(Type.joins(:master_type)).order("master_types_types.name ASC").group("master_types_types.id").where(year: year) }

  before_save do
     self.year = date.year
     self.month = date.month
     self.day = date.day
     true
   end
end
