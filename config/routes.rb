Rails.application.routes.draw do
  resources :types
  resources :operations do
    collection do
      get '/:year(/:month(/:day))' => 'operations#calendar', :as => :calendar, :constraints => { :year => /\d{4}/, :month => /\d{1,2}/, :day => /\d{1,2}/ }
    end
  end
  resources :users

  get '/login' => 'sessions#new'
  post '/login' => 'sessions#create'
  get '/logout' => 'sessions#destroy'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
