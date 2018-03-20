json.cache! ['withdrawals', Withdrawal.maximum(:updated_at)] do
  json.array! @withdrawals, partial: 'withdrawals/withdrawal', as: :withdrawal
end
