class OperationChannel < ApplicationCable::Channel
  def subscribed
    logger.info(params[:token])
    begin
      hmac_secret = Rails.application.secrets[:token_key_base]
      # add leeway to ensure the token is still accepted
      user = JWT.decode params[:token], hmac_secret, true, { :exp_leeway => 30, :algorithm => 'HS512' }
      if user
        stream_from 'operations'
      end
    rescue JWT::ExpiredSignature
      reject
      logger.error("not authenticated")
    end
  end

  #def receive(data)
  #  Rails.logger.info data
    #ActionCable.server.broadcast("chat_#{params[:room]}", data)
  #end
end
