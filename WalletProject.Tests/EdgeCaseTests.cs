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
    public class EdgeCaseTests : IClassFixture<TestWebAppFactory<Startup>>
    {
        private readonly HttpClient _client;

        public EdgeCaseTests(TestWebAppFactory<Startup> factory)
        {
            _client = factory.CreateClient();
        }

        public class LargeAmountTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public LargeAmountTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task CreateTransaction_LargeAmount_ProcessesCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "large_amount_user",
                    Email = "large_amount_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create account with very large balance
                var largeAmount = 999999999999.99m; // Near maximum decimal precision
                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Large Amount Account",
                        Balance = largeAmount
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                accountResponse.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Test large transaction
                var largeTransactionAmount = 123456789.12m;
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = largeTransactionAmount,
                    Description = "Large amount transaction test"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

                transactionResponse.EnsureSuccessStatusCode();
                var createdTransaction = await Utilities.GetDeserializedContent<TransactionReadDTO>(transactionResponse);

                Assert.Equal(largeTransactionAmount, createdTransaction.Amount);

                // Verify balance precision is maintained
                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                var expectedBalance = largeAmount - largeTransactionAmount;
                Assert.Equal(expectedBalance, updatedAccount.CoreDetails.Balance);
            }

            [Fact]
            public async Task CreateAccount_MaximumDecimalBalance_HandlesCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "max_decimal_user",
                    Email = "max_decimal_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Test with maximum reasonable decimal value for financial applications
                var maxAmount = 999999999999999.99m;
                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Maximum Balance Account",
                        Balance = maxAmount
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);

                accountResponse.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                Assert.Equal(maxAmount, createdAccount.CoreDetails.Balance);
            }
        }

        public class ZeroBalanceTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ZeroBalanceTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task ZeroBalanceAccount_AllOperations_BehaveCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "zero_balance_user",
                    Email = "zero_balance_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create account with zero balance
                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Zero Balance Account",
                        Balance = 0
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                accountResponse.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Test that zero balance account can be created
                Assert.Equal(0, createdAccount.CoreDetails.Balance);

                // Test that spending from zero balance fails
                var spendTransaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 1,
                    Description = "Attempt to spend from zero balance"
                };

                var spendContent = Utilities.GetStringContent(spendTransaction);
                var spendResponse = await _client.PostAsync("/api/transaction", spendContent);
                Assert.Equal(HttpStatusCode.BadRequest, spendResponse.StatusCode);

                // Test that receiving money works
                var receiveTransaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.SYSTEM,
                    SourceName = "System Credit",
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdAccount.Id,
                    Amount = 100,
                    Description = "Credit to zero balance account"
                };

                var receiveContent = Utilities.GetStringContent(receiveTransaction);
                var receiveResponse = await _client.PostAsync("/api/transaction", receiveContent);
                receiveResponse.EnsureSuccessStatusCode();

                // Verify balance updated
                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                Assert.Equal(100, updatedAccount.CoreDetails.Balance);

                // Test that zero balance account can be deleted
                var spendAllTransaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 100,
                    Description = "Spend all to return to zero"
                };

                var spendAllContent = Utilities.GetStringContent(spendAllTransaction);
                await _client.PostAsync("/api/transaction", spendAllContent);

                var deleteResponse = await _client.DeleteAsync($"/api/account/{createdAccount.Id}");
                deleteResponse.EnsureSuccessStatusCode();
            }

            [Fact]
            public async Task ZeroBalanceUser_TotalBalance_ReturnsZero()
            {
                var user = new UserCreateDTO
                {
                    Username = "zero_total_user",
                    Email = "zero_total_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create multiple zero balance accounts
                for (int i = 0; i < 3; i++)
                {
                    var account = new AccountCreateDTO
                    {
                        UserId = createdUser.Id,
                        IsMain = false,
                        CoreDetails = new CoreDetailsCreateDTO
                        {
                            Name = $"Zero Account {i + 1}",
                            Balance = 0
                        }
                    };

                    var accountContent = Utilities.GetStringContent(account);
                    await _client.PostAsync("/api/account", accountContent);
                }

                // Check total balance
                var balanceResponse = await _client.GetAsync($"/api/user/{createdUser.Id}/total-balance");
                balanceResponse.EnsureSuccessStatusCode();
                var balanceData = await Utilities.GetDeserializedContent<UserTotalBalanceDTO>(balanceResponse);

                Assert.Equal(0, balanceData.TotalBalance);
                Assert.Equal(4, balanceData.AccountCount); // Including main account
            }
        }

        public class PrecisionTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public PrecisionTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task DecimalPrecision_SmallAmounts_MaintainsPrecision()
            {
                var user = new UserCreateDTO
                {
                    Username = "precision_user",
                    Email = "precision_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create account with precise decimal balance
                var preciseAmount = 123.45m;
                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Precision Test Account",
                        Balance = preciseAmount
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Test transaction with precise amount
                var preciseTransactionAmount = 12.34m;
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = preciseTransactionAmount,
                    Description = "Precision test transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                transactionResponse.EnsureSuccessStatusCode();

                // Verify precision is maintained
                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                var expectedBalance = preciseAmount - preciseTransactionAmount;
                Assert.Equal(expectedBalance, updatedAccount.CoreDetails.Balance);
                Assert.Equal(111.11m, updatedAccount.CoreDetails.Balance);
            }

            [Fact]
            public async Task DecimalPrecision_MultipleOperations_AccumulatesCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "accumulation_user",
                    Email = "accumulation_user@example.com",
                    Password = "password123"
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
                        Name = "Accumulation Test Account",
                        Balance = 1000.00m
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Perform multiple small transactions
                decimal[] amounts = { 0.01m, 0.99m, 1.50m, 2.33m, 5.17m };
                decimal totalSpent = 0;

                foreach (var amount in amounts)
                {
                    var transaction = new TransactionCreateDTO
                    {
                        SourceType = SourceType.ACCOUNT,
                        SourceAccountId = createdAccount.Id,
                        DestinationType = DestinationType.SPEND,
                        Amount = amount,
                        Description = $"Precision test transaction {amount}"
                    };

                    var transactionContent = Utilities.GetStringContent(transaction);
                    await _client.PostAsync("/api/transaction", transactionContent);
                    totalSpent += amount;
                }

                // Verify final balance
                var finalAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var finalAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(finalAccountResponse);
                var expectedFinalBalance = 1000.00m - totalSpent;
                Assert.Equal(expectedFinalBalance, finalAccount.CoreDetails.Balance);
                Assert.Equal(990.00m, finalAccount.CoreDetails.Balance);
            }
        }

        public class BoundaryTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public BoundaryTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task Transaction_ExactBalanceAmount_ProcessesCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "exact_balance_user",
                    Email = "exact_balance_user@example.com",
                    Password = "password123"
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
                        Name = "Exact Balance Test Account",
                        Balance = 100.00m
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Transaction for exact balance amount
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 100.00m,
                    Description = "Exact balance transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                transactionResponse.EnsureSuccessStatusCode();

                // Verify balance is exactly zero
                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                Assert.Equal(0, updatedAccount.CoreDetails.Balance);
            }

            [Fact]
            public async Task Transaction_OneOverBalance_ReturnsBadRequest()
            {
                var user = new UserCreateDTO
                {
                    Username = "over_balance_user",
                    Email = "over_balance_user@example.com",
                    Password = "password123"
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
                        Name = "Over Balance Test Account",
                        Balance = 100.00m
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Transaction for one cent over balance
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 100.01m,
                    Description = "Over balance transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);

                Assert.Equal(HttpStatusCode.BadRequest, transactionResponse.StatusCode);
            }

            [Fact]
            public async Task Transaction_MinimumAmount_ProcessesCorrectly()
            {
                var user = new UserCreateDTO
                {
                    Username = "minimum_amount_user",
                    Email = "minimum_amount_user@example.com",
                    Password = "password123"
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
                        Name = "Minimum Amount Test Account",
                        Balance = 1.00m
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Transaction for minimum amount (1 cent)
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 0.01m,
                    Description = "Minimum amount transaction"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                transactionResponse.EnsureSuccessStatusCode();

                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                Assert.Equal(0.99m, updatedAccount.CoreDetails.Balance);
            }
        }
    }
}
