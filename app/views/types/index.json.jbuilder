json.cache! ['types', Type.maximum(:updated_at)] do
  json.array! @types, partial: 'types/type', as: :type
end
