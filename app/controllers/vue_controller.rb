class VueController < ApplicationController
  skip_before_action :authorize, raise: false

  def index
    render html: ''.html_safe, layout: 'vue'
  end
end
