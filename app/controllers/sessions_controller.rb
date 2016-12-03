class SessionsController < ApplicationController

  def new
  end

  def create
    user = User.find_by_email(params[:email])
    # If the user exists AND the password entered is correct.
    respond_to do |format|
      if user && user.authenticate(params[:password])
        # Save the user id inside the browser cookie. This is how we keep the user
        # logged in when they navigate around our website.
        session[:user_id] = user.id
        format.html { redirect_to '/' }
        format.json { render json: {status: "true"}, status: :ok }
      else
      # If user's login doesn't work, send them back to the login form.
        format.html { redirect_to '/login' }
        format.json { render json: {error_msg: "Errore"}, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to '/login'
  end

end
