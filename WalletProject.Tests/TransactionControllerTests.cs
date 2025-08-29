using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Src.Controllers;
using Src.Entities;
using Src.Shared.DTO;
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
                    Password = "password",
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
                        Balance = 100,
                    },
                };

                var accountContent1 = Utilities.GetStringContent(account1);
                var response1 = await _client.PostAsync("/api/account", accountContent1);
                var createdAccount1 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response1
                );

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO { Name = "Savings", Balance = 0 },
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response2
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

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
                    Password = "password",
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
                        Balance = 20,
                    },
                };

                var accountContent1 = Utilities.GetStringContent(account1);
                var response1 = await _client.PostAsync("/api/account", accountContent1);
                var createdAccount1 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response1
                );

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO { Name = "Savings", Balance = 0 },
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response2
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

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
                    Password = "password",
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
                        Balance = 100,
                    },
                };

                var accountContent1 = Utilities.GetStringContent(account1);
                var response1 = await _client.PostAsync("/api/account", accountContent1);
                var createdAccount1 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response1
                );

                var account2 = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO { Name = "Savings", Balance = 0 },
                };

                var accountContent2 = Utilities.GetStringContent(account2);
                var response2 = await _client.PostAsync("/api/account", accountContent2);
                var createdAccount2 = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response2
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount1.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount2.Id,
                    Amount = 50,
                    Description = "Test transaction",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

                var getResponse = await _client.GetAsync(
                    $"/api/transaction/{createdTransaction.Id}"
                );
                getResponse.EnsureSuccessStatusCode();
                var fetchedTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    getResponse
                );

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
                Password = "password",
            };

            var userContent = Utilities.GetStringContent(user);
            var userResponse = await _client.PostAsync("/api/user", userContent);
            var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

            var account1 = new AccountCreateDTO
            {
                UserId = createdUser.Id,
                IsMain = false,
                CoreDetails = new CoreDetailsCreateDTO { Name = "Source Account", Balance = 100 },
            };

            var accountContent1 = Utilities.GetStringContent(account1);
            var response1 = await _client.PostAsync("/api/account", accountContent1);
            var createdAccount1 = await Utilities.GetDeserializedContent<AccountReadDTO>(response1);

            var account2 = new AccountCreateDTO
            {
                UserId = createdUser.Id,
                IsMain = false,
                CoreDetails = new CoreDetailsCreateDTO { Name = "Savings", Balance = 0 },
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
                Description = "Test transaction",
            };

            var transactionContent = Utilities.GetStringContent(transaction);
            var transactionResponse = await _client.PostAsync(
                "/api/transaction",
                transactionContent
            );

            Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
        }

        [Fact]
        public async Task CreateTransaction_ToSameAccount_ReturnsBadRequest()
        {
            var user = new UserCreateDTO
            {
                Username = "testuser20",
                Email = "testuser20@example.com",
                Password = "password",
            };

            var userContent = Utilities.GetStringContent(user);
            var userResponse = await _client.PostAsync("/api/user", userContent);
            var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

            var account1 = new AccountCreateDTO
            {
                UserId = createdUser.Id,
                IsMain = false,
                CoreDetails = new CoreDetailsCreateDTO { Name = "Source Account", Balance = 100 },
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
                Description = "Test transaction",
            };

            var transactionContent = Utilities.GetStringContent(transaction);
            var transactionResponse = await _client.PostAsync(
                "/api/transaction",
                transactionContent
            );

            Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
        }

        public class ExternalTransactionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ExternalTransactionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateTransaction_ToExternalIBAN_ReturnsCreatedTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_external_iban",
                    Email = "testuser_external_iban@example.com",
                    Password = "password",
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
                        Name = "Source Account",
                        Balance = 500,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.IBAN,
                    DestinationIban = "TR330006100519786457841326",
                    DestinationName = "External Bank Account",
                    Amount = 200,
                    Description = "Transfer to external IBAN",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

                Assert.Equal(transaction.Amount, createdTransaction.Amount);
                Assert.Equal(transaction.DestinationIban, createdTransaction.DestinationIban);
                Assert.Equal(transaction.DestinationName, createdTransaction.DestinationName);

                var accountGetResponse = await _client.GetAsync(
                    $"/api/account/{createdAccount.Id}"
                );
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    accountGetResponse
                );
                Assert.Equal(300, updatedAccount.CoreDetails.Balance);
            }

            [Fact]
            public async Task CreateTransaction_FromExternalIBAN_ReturnsCreatedTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_from_external",
                    Email = "testuser_from_external@example.com",
                    Password = "password",
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
                        Name = "Destination Account",
                        Balance = 0,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.IBAN,
                    SourceIban = "TR330006100519786457841326",
                    SourceName = "External Bank Account",
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount.Id,
                    Amount = 300,
                    Description = "Transfer from external IBAN",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

                Assert.Equal(transaction.Amount, createdTransaction.Amount);
                Assert.Equal(transaction.SourceIban, createdTransaction.SourceIban);
                Assert.Equal(transaction.SourceName, createdTransaction.SourceName);

                var accountGetResponse = await _client.GetAsync(
                    $"/api/account/{createdAccount.Id}"
                );
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    accountGetResponse
                );
                Assert.Equal(300, updatedAccount.CoreDetails.Balance);
            }
        }

        public class SystemTransactionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public SystemTransactionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateTransaction_SystemToAccount_ReturnsCreatedTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_system",
                    Email = "testuser_system@example.com",
                    Password = "password",
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
                        Name = "Interest Account",
                        Balance = 1000,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.SYSTEM,
                    SourceName = "Interest Payment System",
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount.Id,
                    Amount = 50,
                    Description = "Monthly interest payment",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

                Assert.Equal(transaction.Amount, createdTransaction.Amount);
                Assert.Equal(transaction.SourceName, createdTransaction.SourceName);
                Assert.Equal(SourceType.SYSTEM, createdTransaction.SourceType);

                var accountGetResponse = await _client.GetAsync(
                    $"/api/account/{createdAccount.Id}"
                );
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    accountGetResponse
                );
                Assert.Equal(1050, updatedAccount.CoreDetails.Balance);
            }
        }

        public class SpendingTransactionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public SpendingTransactionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateTransaction_SpendingTransaction_ReturnsCreatedTransaction()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_spending",
                    Email = "testuser_spending@example.com",
                    Password = "password",
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
                        Name = "Spending Account",
                        Balance = 500,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 150,
                    Description = "Grocery shopping",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(
                    transactionResponse
                );

                Assert.Equal(transaction.Amount, createdTransaction.Amount);
                Assert.Equal(DestinationType.SPEND, createdTransaction.DestinationType);
                Assert.Null(createdTransaction.DestinationAccountId);

                var accountGetResponse = await _client.GetAsync(
                    $"/api/account/{createdAccount.Id}"
                );
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    accountGetResponse
                );
                Assert.Equal(350, updatedAccount.CoreDetails.Balance);
            }
        }

        public class TransactionHistoryTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public TransactionHistoryTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task GetTransactionsByAccount_WithPagination_ReturnsCorrectResults()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_history",
                    Email = "testuser_history@example.com",
                    Password = "password",
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
                        Name = "Transaction History Account",
                        Balance = 1000,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                for (int i = 1; i <= 5; i++)
                {
                    var transaction = new TransactionCreateDTO
                    {
                        SourceType = SourceType.ACCOUNT,
                        SourceAccountId = createdAccount.Id,
                        DestinationType = DestinationType.SPEND,
                        Amount = i * 10,
                        Description = $"Transaction {i}",
                    };

                    var transactionContent = Utilities.GetStringContent(transaction);
                    await _client.PostAsync("/api/transaction", transactionContent);
                }

                var historyResponse = await _client.GetAsync(
                    $"/api/transaction/account/{createdAccount.Id}?skip=0&limit=3"
                );
                historyResponse.EnsureSuccessStatusCode();
                var transactionHistory = await Utilities.GetDeserializedContent<
                    ListReadDTO<TransactionReadDTO>
                >(historyResponse);

                Assert.Equal(3, transactionHistory.Data.Count());
                Assert.Equal(5, transactionHistory.Total);
            }
        }

        public class DeletedAccountTransactionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public DeletedAccountTransactionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateTransaction_WithDeletedAccount_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "testuser_deleted_account",
                    Email = "testuser_deleted_account@example.com",
                    Password = "password",
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
                        Name = "To Be Deleted Account",
                        Balance = 0,
                    },
                };

                var accountContent = Utilities.GetStringContent(account);
                var response = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(
                    response
                );

                await _client.DeleteAsync($"/api/account/{createdAccount.Id}");

                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.SYSTEM,
                    SourceName = "System",
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount.Id,
                    Amount = 100,
                    Description = "Transaction to deleted account",
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync(
                    "/api/transaction",
                    transactionContent
                );

                Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
            }
        }
    }
}
