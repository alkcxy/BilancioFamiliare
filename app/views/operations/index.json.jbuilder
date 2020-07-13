cache_key = ['operations', Operation.maximum_update(params[:year]), params[:year]]
cache_key << params[:q] if params[:q]
json.cache! cache_key do
  json.array! @operations, partial: 'operations/operation', as: :operation
end
