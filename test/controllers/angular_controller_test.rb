require 'test_helper'

class AngularControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Stub Shakapacker helpers to avoid compilation in test
    ApplicationController.class_eval do
      helper_method :stylesheet_pack_tag, :javascript_pack_tag

      def stylesheet_pack_tag(*args)
        '<link rel="stylesheet" href="/packs-test/application.css" />'.html_safe
      end

      def javascript_pack_tag(*args)
        '<script src="/packs-test/application.js"></script>'.html_safe
      end
    end
  end

  test "root path returns success" do
    get root_path
    assert_response :success
  end

  test "root path renders angular layout" do
    get root_path
    assert_match "ng-app", response.body
    assert_match "bilancioFamiliare", response.body
  end

  test "root path includes javascript pack tag" do
    get root_path
    assert_match "application", response.body
  end

  test "root path includes ng-view container" do
    get root_path
    assert_match "ng-view", response.body
  end
end
