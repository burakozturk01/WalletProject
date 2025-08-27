using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Src.Controllers;
using Src.Entities;
using Xunit;

namespace WalletProject.Tests
{
    public class TransactionControllerTests : IClassFixture<TestWebAppFactory<Startup>>
    {
        private readonly HttpClient _client;

        public TransactionControllerTests(TestWebAppFactory<Startup> factory)
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
            public async Task CreateTransaction_ValidTransaction_ReturnsCreatedTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser16",
                    Email = "testuser16@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                        Name = "Savings",
                        Balance = 0
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(response2);

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(transactionResponse);

                Assert.Equal(transaction.Amount, createdTransaction.Amount);
                Assert.Equal(transaction.Description, createdTransaction.Description);
            }

            [Fact]
            public async Task CreateTransaction_InsufficientBalance_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser17",
                    Email = "testuser17@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                var account1 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Source Account",
                        Balance = 20
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
                        Name = "Savings",
                        Balance = 0
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(response2);

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

                Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
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
            public async Task GetTransaction_ExistingTransaction_ReturnsTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser18",
                    Email = "testuser18@example.com",
                    Password = "password"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                        Name = "Savings",
                        Balance = 0
                    }
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(response2);

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(transactionResponse);

                var getResponse = await _client.GetAsync($"/api/transaction/{createdTransaction.Id}");
                getResponse.EnsureSuccessStatusCode();
                var fetchedTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(getResponse);

                Assert.Equal(createdTransaction.Id, fetchedTransaction.Id);
            }

            [Fact]
            public async Task GetTransaction_NonExistingTransaction_ReturnsNotFound()
            {
                var response = await _client.GetAsync($"/api/transaction/{Guid.NewGuid()}");
                Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            }
        }

        [Fact]
        public async Task CreateTransaction_NegativeAmount_ReturnsBadRequest()
        {
            var user = new UserCreateDTO
            {
                Username = "testuser19",
                Email = "testuser19@example.com",
                Password = "password"
            };

            var userContent = Utilities.GetStringContent(user);
            var userResponse = await _client.PostAsync("/api/user", userContent);
            var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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
                    Name = "Savings",
                    Balance = 0
                }
            };

            var accountContent2 = Utilities.GetStringContent(account2);
            var response2 = await _client.PostAsync("/api/account", accountContent2);
            var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(response2);

            var transaction = new TransactionCreateDTO
            {
                SourceType = SourceType.ACCOUNT,
                SourceAccountId = createdAccount1.Id,
                DestinationType = DestinationType.ACCOUNT,
                DestinationAccountId = createdAccount2.Id,
                Amount = -50,
                Description = "Test transaction"
            };

            var transactionContent = Utilities.GetStringContent(transaction);
            var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

            Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
        }

        [Fact]
        public async Task CreateTransaction_ToSameAccount_ReturnsBadRequest()
        {
            var user = new UserCreateDTO
            {
                Username = "testuser20",
                Email = "testuser20@example.com",
                Password = "password"
            };

            var userContent = Utilities.GetStringContent(user);
            var userResponse = await _client.PostAsync("/api/user", userContent);
            var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

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

            var transaction = new TransactionCreateDTO
            {
                SourceType = SourceType.ACCOUNT,
                SourceAccountId = createdAccount1.Id,
                DestinationType = DestinationType.ACCOUNT,
                DestinationAccountId = createdAccount1.Id,
                Amount = 50,
                Description = "Test transaction"
            };

            var transactionContent = Utilities.GetStringContent(transaction);
            var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

            Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
        }
    }
}
