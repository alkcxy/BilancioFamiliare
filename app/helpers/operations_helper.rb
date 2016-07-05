module OperationsHelper

  def subtraction pos_operations, neg_operations
    pos_operations.sum(:amount) - neg_operations.sum(:amount)
  end

  def balance operation_per_month
    number_to_currency(subtraction(operation_per_month.where(sign: "+"), operation_per_month.where(sign: "-")))
  end

  def tot_balance operations_per_month
    number_to_currency(operations_per_month.sum {|o| o.where(sign: "+").sum(:amount)} - operations_per_month.sum {|o| o.where(sign: "-").sum(:amount)})
  end

  def cumulative_balance operations_cumulus, i
    number_to_currency(subtraction(operations_cumulus.where(month: (1..i), sign: "+"), operations_cumulus.where(month: (1..i), sign: "-")))
  end

  def quarterly_balance operations_cumulus, i
    number_to_currency(subtraction(operations_cumulus.where(month: ((i*3)+1..(i+1)*3), sign: "+"), operations_cumulus.where(month: ((i*3)+1..(i+1)*3), sign: "-")))
  end

  def quarterly_balance_diff operations_cumulus_prev, operations_cumulus, i
    month = ((i*3)+1..(i+1)*3)
    prev_year = operations_cumulus_prev.where(month: month)
    t_year = operations_cumulus.where(month: month)
    abs_diff = (100.to_f/(prev_year.where(sign: "+").sum(:amount) - prev_year.where(sign: "-").sum(:amount))*(t_year.where(sign: "+").sum(:amount) - t_year.where(sign: "-").sum(:amount)))-100
    number_to_percentage(abs_diff, precision: 1, strip_insignificant_zeros: true)
  end

  def difference_in_balance operations_cumulus, i
    subtraction(operations_cumulus.where(month: ((i*3)+1..(i+1)*3), sign: "+"), operations_cumulus.where(month: ((i*3)+1..(i+1)*3), sign: "-"))
  end

  def previous_month_diff operations, sign, month
    number_to_percentage((100.to_f/operations.where(sign: sign, month: month-1).sum(:amount).to_f*operations.where(sign: sign, month: month).sum(:amount).to_f)-100, precision: 1, strip_insignificant_zeros: true)
  end

  def saved_or_params obj, field
    obj.method(field).call || params[field]
  end

  def saved_or_default field, default
    field || default
  end

end
