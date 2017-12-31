Rails.application.routes.draw do

  resources :types
  resources :operations do
    collection do
      get '/:year/:month' => 'operations#calendar_month', :as => :calendar_month, :constraints => { :year => /\d{4}/, :month => /\d{1,2}/ }
      get '/year/:year' => 'operations#calendar_year', :as => :calendar_year, :constraints => { :year => /\d{4}/ }
      get 'max'
    end
  end
  resources :users

  get '/login' => 'sessions#new'
  post '/login' => 'sessions#create'
  delete '/logout' => 'sessions#destroy'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  get '/home' => 'home#index'
  root :to => 'home#index'
end
