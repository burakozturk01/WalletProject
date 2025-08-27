using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Src.Controllers;
using Src.Shared.DTO;
using Xunit;

namespace WalletProject.Tests
{
    public class AccountControllerTests : IClassFixture<TestWebAppFactory<Startup>>
    {
        private readonly HttpClient _client;

        public AccountControllerTests(TestWebAppFactory<Startup> factory)
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
            public async Task CreateAccount_ValidAccount_ReturnsCreatedAccount()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser10",
                    Email = "testuser10@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                var response = await _client.PostAsync("/api/account", accountContent);

                response.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(response);

                Assert.Equal(account.UserId, createdAccount.UserId);
                Assert.Equal(account.CoreDetails.Name, createdAccount.CoreDetails.Name);
            }

            [Fact]
            public async Task CreateAccount_MultipleMainAccounts_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser11",
                    Email = "testuser11@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = true,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Main Account",
                        Balance = 0
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                await _client.PostAsync("/api/account", accountContent);

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = true,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Another Main Account",
                        Balance = 0
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response = await _client.PostAsync("/api/account", accountContent2);

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
            public async Task GetAccount_ExistingAccount_ReturnsAccount()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser12",
                    Email = "testuser12@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(response);

                var getResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                getResponse.EnsureSuccessStatusCode();
                var fetchedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(getResponse);

                Assert.Equal(createdAccount.Id, fetchedAccount.Id);
            }

            [Fact]
            public async Task GetAccount_NonExistingAccount_ReturnsNotFound()
            {
                var response = await _client.GetAsync($"/api/account/{Guid.NewGuid()}");
                Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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
            public async Task DeleteAccount_AccountWithZeroBalance_ReturnsOk()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser13",
                    Email = "testuser13@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Savings",
                        Balance = 0
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(response);

                var deleteResponse = await _client.DeleteAsync($"/api/account/{createdAccount.Id}");
                deleteResponse.EnsureSuccessStatusCode();

                var getResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
            }

            [Fact]
            public async Task DeleteAccount_AccountWithNonZeroBalance_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser14",
                    Email = "testuser14@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(response);

                var deleteResponse = await _client.DeleteAsync($"/api/account/{createdAccount.Id}");
                Assert.Equal(HttpStatusCode.BadRequest, deleteResponse.StatusCode);
            }

            [Fact]
            public async Task DeleteAccount_MainAccount_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser15",
                    Email = "testuser15@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Get the automatically created main account instead of trying to create another one
                var accountsResponse = await _client.GetAsync($"/api/account/user/{createdUser.Id}");
                accountsResponse.EnsureSuccessStatusCode();
                var accountsList = await Utilities.GetDeserializedContent<ListReadDTO<AccountReadDTO>>(accountsResponse);
                var mainAccount = accountsList.Data.First(a => a.IsMain);

                var deleteResponse = await _client.DeleteAsync($"/api/account/{mainAccount.Id}");
                Assert.Equal(HttpStatusCode.BadRequest, deleteResponse.StatusCode);
            }
        }
    }
}
