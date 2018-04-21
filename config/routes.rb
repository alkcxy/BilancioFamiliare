Rails.application.routes.draw do

  resources :withdrawals
  resources :types
  resources :operations do
    collection do
      get '/:year/:month' => 'operations#calendar_month', :as => :calendar_month, :constraints => { :year => /\d{4}/, :month => /\d{1,2}/ }
      get '/year/:year' => 'operations#calendar_year', :as => :calendar_year, :constraints => { :year => /\d{4}/ }
      get 'max'
    end
  end
  resources :users , except: :destroy

  get '/login' => 'sessions#new'
  post '/login' => 'sessions#create'

  root :to => 'angular#index'
  get '/pages/:path.html' => 'angular#page', :constraints => { :path => /.+/  }

end
