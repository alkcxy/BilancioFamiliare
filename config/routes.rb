Rails.application.routes.draw do

  resources :withdrawals do
    collection do
      get '/all' => 'withdrawals#all', :as => :all
      get '/archive' => 'withdrawals#archive', :as => :archive
      post 'check_duplicates'
      post 'check_contextual'
    end
  end
  resources :types
  resources :operations do
    collection do
      get '/:year/:month' => 'operations#calendar_month', :as => :calendar_month, :constraints => { :year => /\d{4}/, :month => /\d{1,2}/ }
      get '/year/:year' => 'operations#calendar_year', :as => :calendar_year, :constraints => { :year => /\d{4}/ }
      get 'max'
      post 'bulk'
      post 'extract'
      post 'check_duplicates'
      post 'check_contextual'
    end
  end
  resources :users , except: :destroy

  get '/login' => 'sessions#new'
  post '/login' => 'sessions#create'

  root :to => 'vue#index'

end
