Feature: User login

  Scenario Outline: A seeded <role> can log in with the mock password
    Given I am on the login page
    When I sign in as "<username>" with the mock password
    Then I should be redirected away from the login page
    And I should see that I am signed in as "<username>"

    Examples:
      | role      | username  |
      | OWNER     | owner     |
      | MODERATOR | moderator |
      | USER      | user      |
