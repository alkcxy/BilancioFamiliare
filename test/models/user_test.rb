require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test "valid user" do
    user = User.new(
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      password_confirmation: "password123"
    )
    assert user.valid?
  end

  test "invalid without name" do
    user = User.new(name: nil)
    assert_not user.valid?
    assert user.errors[:name].any?
  end

  test "authentication with bcrypt" do
    user = User.create!(
      name: "Auth User",
      email: "auth@example.com",
      password: "secretpassword",
      password_confirmation: "secretpassword"
    )
    assert user.authenticate("secretpassword")
    assert_not user.authenticate("wrongpassword")
  end
end
