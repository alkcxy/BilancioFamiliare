require 'test_helper'

class VueControllerTest < ActionDispatch::IntegrationTest
  test "root path returns success" do
    get root_path
    assert_response :success
  end

  test "root path renders vue mount point" do
    get root_path
    assert_match 'id="app"', response.body
  end

  test "root path includes vite script tag" do
    get root_path
    assert_match 'type="module"', response.body
  end
end
