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

        public class ComponentTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ComponentTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateAccount_WithAllComponents_ReturnsAccountWithComponents()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_components",
                    Email = "testuser_components@example.com",
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
                        Name = "Full Feature Account",
                        Balance = 1000
                    },
                    ActiveAccount = new ActiveAccountCreateDTO
                    {
                        IBAN = "TR330006100519786457841326"
                    },
                    SpendingLimit = new SpendingLimitCreateDTO
                    {
                        LimitAmount = 500,
                        Timeframe = Src.Components.LimitTimeframe.MONTHLY,
                        CurrentSpending = 0
                    },
                    SavingGoal = new SavingGoalCreateDTO
                    {
                        GoalName = "Vacation Fund",
                        TargetAmount = 5000
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);

                response.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(response);

                Assert.Equal(account.CoreDetails.Name, createdAccount.CoreDetails.Name);
                Assert.Equal(account.CoreDetails.Balance, createdAccount.CoreDetails.Balance);
                Assert.NotNull(createdAccount.ActiveAccount);
                Assert.Equal(account.ActiveAccount.IBAN, createdAccount.ActiveAccount.IBAN);
                Assert.NotNull(createdAccount.SpendingLimit);
                Assert.Equal(account.SpendingLimit.LimitAmount, createdAccount.SpendingLimit.LimitAmount);
                Assert.NotNull(createdAccount.SavingGoal);
                Assert.Equal(account.SavingGoal.GoalName, createdAccount.SavingGoal.GoalName);
            }
        }

        public class ValidationTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ValidationTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateAccount_InvalidUser_ReturnsBadRequest()
            {
                var account = new AccountCreateDTO
                {
                    UserId = Guid.NewGuid(), // Non-existent user
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Invalid User Account",
                        Balance = 100
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);

                Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            }

            [Fact]
            public async Task UpdateAccount_MainAccount_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_update_main",
                    Email = "testuser_update_main@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Get the automatically created main account
                var accountsResponse = await _client.GetAsync($"/api/account/user/{createdUser.Id}");
                accountsResponse.EnsureSuccessStatusCode();
                var accountsList = await Utilities.GetDeserializedContent<ListReadDTO<AccountReadDTO>>(accountsResponse);
                var mainAccount = accountsList.Data.First(a => a.IsMain);

                var updateAccount = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = true,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Updated Main Account",
                        Balance = 500
                    }
                };

                var updateContent = Utilities.GetStringContent(updateAccount);
                var updateResponse = await _client.PutAsync($"/api/account/{mainAccount.Id}", updateContent);

                Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
            }
        }

        public class PaginationTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public PaginationTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task GetAccountsByUser_WithPagination_ReturnsCorrectResults()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_pagination",
                    Email = "testuser_pagination@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create multiple accounts
                for (int i = 1; i <= 3; i++)
                {
                    var account = new AccountCreateDTO
                    {
                        UserId = createdUser.Id,
                        IsMain = false,
                        CoreDetails = new CoreDetailsCreateDTO
                        {
                            Name = $"Account {i}",
                            Balance = i * 100
                        }
                    };

                    var accountContent = Utilities.GetStringContent(account);
                    await _client.PostAsync("/api/account", accountContent);
                }

                // Test pagination
                var paginatedResponse = await _client.GetAsync($"/api/account/user/{createdUser.Id}?skip=0&limit=2");
                paginatedResponse.EnsureSuccessStatusCode();
                var paginatedAccounts = await Utilities.GetDeserializedContent<ListReadDTO<AccountReadDTO>>(paginatedResponse);

                Assert.Equal(2, paginatedAccounts.Data.Count());
                Assert.Equal(4, paginatedAccounts.Total); // Including main account
            }
        }

        public class BalanceUpdateTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public BalanceUpdateTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task AccountBalance_UpdatedByTransaction_ReflectsCorrectBalance()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_balance_update",
                    Email = "testuser_balance_update@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create source account
                var sourceAccount = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Source Account",
                        Balance = 1000
                    }
                };

                var sourceContent = Utilities.GetStringContent(sourceAccount);
                var sourceResponse = await _client.PostAsync("/api/account", sourceContent);
                var createdSourceAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(sourceResponse);

                // Create destination account
                var destAccount = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Destination Account",
                        Balance = 0
                    }
                };

                var destContent = Utilities.GetStringContent(destAccount);
                var destResponse = await _client.PostAsync("/api/account", destContent);
                var createdDestAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(destResponse);

                // Create transaction
                var transaction = new TransactionCreateDTO
                {
                    SourceType = Src.Entities.SourceType.ACCOUNT,
                    SourceAccountId = createdSourceAccount.Id,
                    DestinationType = Src.Entities.DestinationType.ACCOUNT,
                    DestinationAccountId = createdDestAccount.Id,
                    Amount = 300,
                    Description = "Balance update test"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                await _client.PostAsync("/api/transaction", transactionContent);

                // Verify source account balance
                var sourceGetResponse = await _client.GetAsync($"/api/account/{createdSourceAccount.Id}");
                sourceGetResponse.EnsureSuccessStatusCode();
                var updatedSourceAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(sourceGetResponse);
                Assert.Equal(700, updatedSourceAccount.CoreDetails.Balance);

                // Verify destination account balance
                var destGetResponse = await _client.GetAsync($"/api/account/{createdDestAccount.Id}");
                destGetResponse.EnsureSuccessStatusCode();
                var updatedDestAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(destGetResponse);
                Assert.Equal(300, updatedDestAccount.CoreDetails.Balance);
            }
        }
    }
}
