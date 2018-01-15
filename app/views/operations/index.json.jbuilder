json.cache! ['operations', Operation.maximum(:updated_at), params[:year], params[:month]] do
  json.array!(@operations) do |operation|
    json.cache! operation do
      json.extract! operation, :id, :note, :sign, :type_id, :user_id, :date, :year, :month, :day
      json.url operation_url(operation, format: :json)
      json.user do
        json.id = operation.user.id
        json.name operation.user.name
      end
      json.type do
        json.id operation.type.id
        json.name operation.type.name
        if operation.type.spending_roof
          json.spending_roof operation.type.spending_roof.to_f
        end
      end
      json.amount operation.amount.to_f
      json.created_at operation.created_at.to_i
      json.updated_at operation.updated_at.to_i
    end
  end
end
