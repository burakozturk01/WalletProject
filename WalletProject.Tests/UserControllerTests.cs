using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Src.Controllers;
using Xunit;

namespace WalletProject.Tests
{
    public class UserControllerTests : IClassFixture<TestWebAppFactory<Startup>>
    {
        private readonly HttpClient _client;

        public UserControllerTests(TestWebAppFactory<Startup> factory)
        {
            _client = factory.CreateClient();
        }

        public class CreationTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public CreationTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateUser_ValidUser_ReturnsCreatedUser()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser",
                    Email = "testuser@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);

                response.EnsureSuccessStatusCode();
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                Assert.Equal(user.Username, createdUser.Username);
                Assert.Equal(user.Email, createdUser.Email);
            }

            [Fact]
            public async Task CreateUser_DuplicateUsername_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser2",
                    Email = "testuser2@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                await _client.PostAsync("/api/user", content);

                var user2 = new UserCreateDTO
                {
                    Username = "testuser2",
                    Email = "testuser3@example.com",
                    Password = "password"
                };

                var content2 = Utilities.GetStringContent(user2);
                var response = await _client.PostAsync("/api/user", content2);

                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }

            [Fact]
            public async Task CreateUser_DuplicateEmail_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser4",
                    Email = "testuser4@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                await _client.PostAsync("/api/user", content);

                var user2 = new UserCreateDTO
                {
                    Username = "testuser5",
                    Email = "testuser4@example.com",
                    Password = "password"
                };

                var content2 = Utilities.GetStringContent(user2);
                var response = await _client.PostAsync("/api/user", content2);

                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }

            [Fact]
            public async Task CreateUser_InvalidEmail_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_invalid_email",
                    Email = "invalid-email",
                    Password = "password123"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);

                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }

            [Fact]
            public async Task CreateUser_ShortPassword_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_short_pass",
                    Email = "testuser_short_pass@example.com",
                    Password = "123"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);

                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }
        }

        public class ReadingTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ReadingTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task GetUser_ExistingUser_ReturnsUser()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser6",
                    Email = "testuser6@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                var getResponse = await _client.GetAsync($"/api/user/{createdUser.Id}");
                getResponse.EnsureSuccessStatusCode();
                var fetchedUser = await Utilities.GetDeserializedContent<UserReadDTO>(getResponse);

                Assert.Equal(createdUser.Id, fetchedUser.Id);
            }

            [Fact]
            public async Task GetUser_NonExistingUser_ReturnsNotFound()
            {
                var response = await _client.GetAsync($"/api/user/{Guid.NewGuid()}");
                Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            }
        }

        public class UpdatingTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public UpdatingTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task UpdateUser_ValidUpdate_ReturnsUpdatedUser()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser7",
                    Email = "testuser7@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                var updateUser = new UserUpdateDTO
                {
                    Username = "updateduser"
                };

                var updateContent = Utilities.GetStringContent(updateUser);
                var updateResponse = await _client.PutAsync($"/api/user/{createdUser.Id}", updateContent);
                updateResponse.EnsureSuccessStatusCode();
                var updatedUser = await Utilities.GetDeserializedContent<UserReadDTO>(updateResponse);

                Assert.Equal(updateUser.Username, updatedUser.Username);
            }

            [Fact]
            public async Task UpdateUser_EmailConflict_ReturnsBadRequest()
            {
                var user1 = new UserCreateDTO
                {
                    Username = "testuser_update1",
                    Email = "testuser_update1@example.com",
                    Password = "password"
                };

                var content1 = Utilities.GetStringContent(user1);
                await _client.PostAsync("/api/user", content1);

                var user2 = new UserCreateDTO
                {
                    Username = "testuser_update2",
                    Email = "testuser_update2@example.com",
                    Password = "password"
                };

                var content2 = Utilities.GetStringContent(user2);
                var response2 = await _client.PostAsync("/api/user", content2);
                var createdUser2 = await Utilities.GetDeserializedContent<UserReadDTO>(response2);

                var updateUser = new UserUpdateDTO
                {
                    Email = "testuser_update1@example.com"
                };

                var updateContent = Utilities.GetStringContent(updateUser);
                var updateResponse = await _client.PutAsync($"/api/user/{createdUser2.Id}", updateContent);

                Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
            }

            [Fact]
            public async Task UpdateUser_UsernameConflict_ReturnsBadRequest()
            {
                var user1 = new UserCreateDTO
                {
                    Username = "testuser_update3",
                    Email = "testuser_update3@example.com",
                    Password = "password"
                };

                var content1 = Utilities.GetStringContent(user1);
                await _client.PostAsync("/api/user", content1);

                var user2 = new UserCreateDTO
                {
                    Username = "testuser_update4",
                    Email = "testuser_update4@example.com",
                    Password = "password"
                };

                var content2 = Utilities.GetStringContent(user2);
                var response2 = await _client.PostAsync("/api/user", content2);
                var createdUser2 = await Utilities.GetDeserializedContent<UserReadDTO>(response2);

                var updateUser = new UserUpdateDTO
                {
                    Username = "testuser_update3"
                };

                var updateContent = Utilities.GetStringContent(updateUser);
                var updateResponse = await _client.PutAsync($"/api/user/{createdUser2.Id}", updateContent);

                Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
            }
        }

        public class DeletionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public DeletionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task DeleteUser_UserWithZeroBalance_ReturnsOk()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser8",
                    Email = "testuser8@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                var deleteResponse = await _client.DeleteAsync($"/api/user/{createdUser.Id}");
                deleteResponse.EnsureSuccessStatusCode();

                var getResponse = await _client.GetAsync($"/api/user/{createdUser.Id}");
                Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
            }

            [Fact]
            public async Task DeleteUser_UserWithNonZeroBalance_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser9",
                    Email = "testuser9@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Savings",
                        Balance = 100
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                await _client.PostAsync("/api/account", accountContent);

                var deleteResponse = await _client.DeleteAsync($"/api/user/{createdUser.Id}");
                Assert.Equal(HttpStatusCode.BadRequest, deleteResponse.StatusCode);
            }

            [Fact]
            public async Task DeleteUser_UserWithTransactionHistory_ReturnsOk()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_transaction_history",
                    Email = "testuser_transaction_history@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                                var account1 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Source Account",
                        Balance = 100
                    }
                };

                var accountContent1 = Utilities.GetStringContent(account1);
                var response1 = await _client.PostAsync("/api/account", accountContent1);
                var createdAccount1 = await Utilities.GetDeserializedContent<AccountReadDTO>(response1);

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Destination Account",
                        Balance = 0
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(response2);

                                var transaction = new TransactionCreateDTO
                {
                    SourceType = Src.Entities.SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = Src.Entities.DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 100,
                    Description = "Transfer all funds"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                await _client.PostAsync("/api/transaction", transactionContent);

                                var transaction2 = new TransactionCreateDTO
                {
                    SourceType = Src.Entities.SourceType.ACCOUNT,
                    SourceAccountId = createdAccount2.Id,
                    DestinationType = Src.Entities.DestinationType.SPEND,
                    Amount = 100,
                    Description = "Spend all funds"
                };

                var transactionContent2 = Utilities.GetStringContent(transaction2);
                await _client.PostAsync("/api/transaction", transactionContent2);

                                var deleteResponse = await _client.DeleteAsync($"/api/user/{createdUser.Id}");
                deleteResponse.EnsureSuccessStatusCode();

                var getResponse = await _client.GetAsync($"/api/user/{createdUser.Id}");
                Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
            }
        }

        public class BalanceTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public BalanceTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task GetUserTotalBalance_MultipleAccounts_ReturnsCorrectTotal()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_balance",
                    Email = "testuser_balance@example.com",
                    Password = "password"
                };

                var content = Utilities.GetStringContent(user);
                var response = await _client.PostAsync("/api/user", content);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(response);

                                var account1 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Savings",
                        Balance = 500
                    }
                };

                var accountContent1 = Utilities.GetStringContent(account1);
                await _client.PostAsync("/api/account", accountContent1);

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Checking",
                        Balance = 250.50m
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                await _client.PostAsync("/api/account", accountContent2);

                                var balanceResponse = await _client.GetAsync($"/api/user/{createdUser.Id}/total-balance");
                balanceResponse.EnsureSuccessStatusCode();
                var balanceData = await Utilities.GetDeserializedContent<UserTotalBalanceDTO>(balanceResponse);

                Assert.Equal(750.50m, balanceData.TotalBalance);
                Assert.Equal(3, balanceData.AccountCount); 
                Assert.Equal(3, balanceData.ActiveAccountCount);
            }
        }
    }
}
