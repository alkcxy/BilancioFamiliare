class AngularController < ApplicationController
  def index
    render layout: 'angular.html.erb'
  end

  #caches_page :page

  def page
    @path = params[:path]
    render :template => 'pages/' + @path, :layout => nil
  end
end
