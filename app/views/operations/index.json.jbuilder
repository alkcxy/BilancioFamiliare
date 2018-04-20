json.cache! ['operations', Operation.maximum_update(params[:year]), params[:year]] do
  json.array! @operations, partial: 'operations/operation', as: :operation
end
