class OperationChannel < ApplicationCable::Channel
  def subscribed
    stream_from 'operations'
  end

  #def receive(data)
  #  Rails.logger.info data
    #ActionCable.server.broadcast("chat_#{params[:room]}", data)
  #end
end
