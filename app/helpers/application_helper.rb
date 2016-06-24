module ApplicationHelper
  # preso da current_page?
  def current_page_start_with?(url_string)
    unless request
      raise "You cannot use helpers that need to determine the current " \
            "page unless your view context provides a Request object " \
            "in a #request method"
    end

    return false unless request.get?

    if request.path == root_path
      return request.path == url_string
    end

    # We ignore any extra parameters in the request_uri if the
    # submitted url doesn't have any either. This lets the function
    # work with things like ?order=asc
    if url_string.index("?")
      request_uri = request.fullpath
    else
      request_uri = request.path
    end

    if url_string =~ /^\w+:\/\//
      url_string.start_with? "#{request.protocol}#{request.host_with_port}#{request_uri}"
    else
      url_string.start_with? request_uri
    end
  end

  def is_active?(resource, start_with=false)
    "active" if current_page?(resource) || (start_with && current_page_start_with?(resource))
  end
end
