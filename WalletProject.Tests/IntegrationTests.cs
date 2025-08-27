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
    public class IntegrationTests : IClassFixture<TestWebAppFactory<Startup>>
    {
        private readonly HttpClient _client;

        public IntegrationTests(TestWebAppFactory<Startup> factory)
        {
            _client = factory.CreateClient();
        }

        public class UserLifecycleTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public UserLifecycleTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task UserLifecycle_CreateToDelete_CompletesSuccessfully()
            {
                // 1. Create user
                var user = new UserCreateDTO
                {
                    Username = "lifecycle_user",
                    Email = "lifecycle_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                userResponse.EnsureSuccessStatusCode();
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // 2. Add additional accounts
                var savingsAccount = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Savings Account",
                        Balance = 1000
                    }
                };

                var savingsContent = Utilities.GetStringContent(savingsAccount);
                var savingsResponse = await _client.PostAsync("/api/account", savingsContent);
                savingsResponse.EnsureSuccessStatusCode();
                var createdSavingsAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(savingsResponse);

                var checkingAccount = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Checking Account",
                        Balance = 500
                    }
                };

                var checkingContent = Utilities.GetStringContent(checkingAccount);
                var checkingResponse = await _client.PostAsync("/api/account", checkingContent);
                checkingResponse.EnsureSuccessStatusCode();
                var createdCheckingAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(checkingResponse);

                // 3. Make transactions between accounts
                var transaction1 = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdSavingsAccount.Id,
                    DestinationType = DestinationType.ACCOUNT,
                    DestinationAccountId = createdCheckingAccount.Id,
                    Amount = 200,
                    Description = "Transfer to checking"
                };

                var transaction1Content = Utilities.GetStringContent(transaction1);
                var transaction1Response = await _client.PostAsync("/api/transaction", transaction1Content);
                transaction1Response.EnsureSuccessStatusCode();

                // 4. Spend all money to achieve zero balance
                var spendTransaction1 = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdSavingsAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 800,
                    Description = "Spend remaining savings"
                };

                var spendContent1 = Utilities.GetStringContent(spendTransaction1);
                await _client.PostAsync("/api/transaction", spendContent1);

                var spendTransaction2 = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdCheckingAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 700,
                    Description = "Spend all checking funds"
                };

                var spendContent2 = Utilities.GetStringContent(spendTransaction2);
                await _client.PostAsync("/api/transaction", spendContent2);

                // 5. Verify zero balances
                var balanceResponse = await _client.GetAsync($"/api/user/{createdUser.Id}/total-balance");
                balanceResponse.EnsureSuccessStatusCode();
                var balanceData = await Utilities.GetDeserializedContent<UserTotalBalanceDTO>(balanceResponse);
                Assert.Equal(0, balanceData.TotalBalance);

                // 6. Delete user
                var deleteResponse = await _client.DeleteAsync($"/api/user/{createdUser.Id}");
                deleteResponse.EnsureSuccessStatusCode();

                // 7. Verify user is deleted
                var getResponse = await _client.GetAsync($"/api/user/{createdUser.Id}");
                Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
            }
        }

        public class BalanceConsistencyTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public BalanceConsistencyTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task BalanceConsistency_MultipleTransactions_MaintainsConsistency()
            {
                // Create user
                var user = new UserCreateDTO
                {
                    Username = "balance_consistency_user",
                    Email = "balance_consistency_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create multiple accounts
                var accounts = new AccountReadDTO[3];
                decimal[] initialBalances = { 1000, 500, 250 };

                for (int i = 0; i < 3; i++)
                {
                    var account = new AccountCreateDTO
                    {
                        UserId = createdUser.Id,
                        IsMain = false,
                        CoreDetails = new CoreDetailsCreateDTO
                        {
                            Name = $"Account {i + 1}",
                            Balance = initialBalances[i]
                        }
                    };

                    var accountContent = Utilities.GetStringContent(account);
                    var accountResponse = await _client.PostAsync("/api/account", accountContent);
                    accounts[i] = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);
                }

                decimal totalInitialBalance = initialBalances.Sum();

                // Perform series of transactions
                var transactions = new[]
                {
                    new { From = 0, To = 1, Amount = 100m },
                    new { From = 1, To = 2, Amount = 150m },
                    new { From = 2, To = 0, Amount = 75m },
                    new { From = 0, To = 2, Amount = 200m }
                };

                foreach (var tx in transactions)
                {
                    var transaction = new TransactionCreateDTO
                    {
                        SourceType = SourceType.ACCOUNT,
                        SourceAccountId = accounts[tx.From].Id,
                        DestinationType = DestinationType.ACCOUNT,
                        DestinationAccountId = accounts[tx.To].Id,
                        Amount = tx.Amount,
                        Description = $"Transfer {tx.Amount} from Account {tx.From + 1} to Account {tx.To + 1}"
                    };

                    var transactionContent = Utilities.GetStringContent(transaction);
                    var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                    transactionResponse.EnsureSuccessStatusCode();
                }

                // Verify total balance remains consistent
                var balanceResponse = await _client.GetAsync($"/api/user/{createdUser.Id}/total-balance");
                balanceResponse.EnsureSuccessStatusCode();
                var balanceData = await Utilities.GetDeserializedContent<UserTotalBalanceDTO>(balanceResponse);

                Assert.Equal(totalInitialBalance, balanceData.TotalBalance);
            }
        }

        public class ComponentManagementTests : IClassFixture<TestWebAppFactory<Startup>>
        {
            private readonly HttpClient _client;

            public ComponentManagementTests(TestWebAppFactory<Startup> factory)
            {
                _client = factory.CreateClient();
            }

            [Fact]
            public async Task ComponentManagement_AccountWithAllComponents_ManagesCorrectly()
            {
                // Create user
                var user = new UserCreateDTO
                {
                    Username = "component_user",
                    Email = "component_user@example.com",
                    Password = "password123"
                };

                var userContent = Utilities.GetStringContent(user);
                var userResponse = await _client.PostAsync("/api/user", userContent);
                var createdUser = await Utilities.GetDeserializedContent<UserReadDTO>(userResponse);

                // Create account with all components
                var account = new AccountCreateDTO
                {
                    UserId = createdUser.Id,
                    IsMain = false,
                    CoreDetails = new CoreDetailsCreateDTO
                    {
                        Name = "Full Feature Account",
                        Balance = 2000
                    },
                    ActiveAccount = new ActiveAccountCreateDTO
                    {
                        IBAN = "TR330006100519786457841326"
                    },
                    SpendingLimit = new SpendingLimitCreateDTO
                    {
                        LimitAmount = 1000,
                        Timeframe = Src.Components.LimitTimeframe.MONTHLY,
                        CurrentSpending = 0
                    },
                    SavingGoal = new SavingGoalCreateDTO
                    {
                        GoalName = "Emergency Fund",
                        TargetAmount = 10000
                    }
                };

                var accountContent = Utilities.GetStringContent(account);
                var accountResponse = await _client.PostAsync("/api/account", accountContent);
                accountResponse.EnsureSuccessStatusCode();
                var createdAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(accountResponse);

                // Verify all components are created
                Assert.NotNull(createdAccount.CoreDetails);
                Assert.NotNull(createdAccount.ActiveAccount);
                Assert.NotNull(createdAccount.SpendingLimit);
                Assert.NotNull(createdAccount.SavingGoal);

                // Verify component data
                Assert.Equal(account.CoreDetails.Name, createdAccount.CoreDetails.Name);
                Assert.Equal(account.ActiveAccount.IBAN, createdAccount.ActiveAccount.IBAN);
                Assert.Equal(account.SpendingLimit.LimitAmount, createdAccount.SpendingLimit.LimitAmount);
                Assert.Equal(account.SavingGoal.GoalName, createdAccount.SavingGoal.GoalName);

                // Test transactions with the account
                var transaction = new TransactionCreateDTO
                {
                    SourceType = SourceType.ACCOUNT,
                    SourceAccountId = createdAccount.Id,
                    DestinationType = DestinationType.SPEND,
                    Amount = 500,
                    Description = "Test spending with components"
                };

                var transactionContent = Utilities.GetStringContent(transaction);
                var transactionResponse = await _client.PostAsync("/api/transaction", transactionContent);
                transactionResponse.EnsureSuccessStatusCode();

                // Verify balance update
                var updatedAccountResponse = await _client.GetAsync($"/api/account/{createdAccount.Id}");
                var updatedAccount = await Utilities.GetDeserializedContent<AccountReadDTO>(updatedAccountResponse);
                Assert.Equal(1500, updatedAccount.CoreDetails.Balance);
            }
        }
    }
}
