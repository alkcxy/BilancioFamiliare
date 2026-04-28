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

  test "invalid without email" do
    user = User.new(name: "Test", email: nil, password: "password123")
    assert_not user.valid?
    assert user.errors[:email].any?
  end

  test "invalid with duplicate email" do
    User.create!(name: "First", email: "dup@example.com", password: "password123", password_confirmation: "password123")
    user = User.new(name: "Second", email: "dup@example.com", password: "password123", password_confirmation: "password123")
    assert_not user.valid?
    assert user.errors[:email].any?
  end

  test "password must be at least 8 characters" do
    user = User.new(name: "Test", email: "short@example.com", password: "short", password_confirmation: "short")
    assert_not user.valid?
    assert user.errors[:password].any?
  end

  test "has many operations" do
    user = users(:one)
    assert_respond_to user, :operations
    assert user.operations.count >= 1
  end
end
