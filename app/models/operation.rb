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

class Operation < ApplicationRecord
  include Repeatable
  set_start_date :date
  belongs_to :type, touch: true
  belongs_to :user, touch: true

  validates :note, length: { maximum: 4000 }, presence: false
  validates :sign, presence: true
  validates :amount, presence: true
  validates :type_id, presence: true
  validates :user_id, presence: true
  validates :date, presence: true

  scope :by_month_and_sign, lambda { |year, month, sign| by_month(year, month).joins(:type, :user).where(sign: sign).order("types.name ASC, users.name ASC, operations.day ASC") }

  scope :by_month, lambda { |year, month| where(year: year, month: month) }

  scope :tot_operations_per_type_per_year, lambda { | year| select("*, sum(amount) sum_amount, master_types_types.name types_name").joins(:type).merge(Type.joins(:master_type)).order("master_types_types.name ASC").group("master_types_types.id").where(year: year) }

  def self.maximum_update(year)
    if year.blank?
      Operation.maximum(:updated_at)
    else
      Operation.where(year: year).maximum(:updated_at)
    end
  end

  before_save do
     self.year = date.year
     self.month = date.month
     self.day = date.day
   end
end
