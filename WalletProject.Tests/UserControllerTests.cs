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
        }
    }
}
