using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Src.Entities;
using Src.Components;
using Src.Shared.Controller;
using Src.Shared.DTO;
using Src.Shared.Repository;

namespace Src.Controllers
{
    public class UserReadDTO
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public class UserCreateDTO
    {
        [Required]
        [MaxLength(64)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }

    public class UserUpdateDTO
    {
        [MaxLength(64)]
        public string? Username { get; set; }

        [EmailAddress]
        [MaxLength(255)]
        public string? Email { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : AppController<User, UserReadDTO>
    {
        public UserController(IRepository<User, UserReadDTO> repository) : base(repository)
        {
        }

        [HttpGet]
        public ActionResult<ListReadDTO<UserReadDTO>> GetUsers([FromQuery] PaginateDTO paginate)
        {
            return GetEntities(paginate);
        }

        [HttpGet("{id}")]
        public ActionResult<UserReadDTO> GetUser(Guid id)
        {
            return FindEntity(u => u.Id == id);
        }

        [HttpPost]
        public ActionResult<UserReadDTO> CreateUser([FromBody] UserCreateDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Check if username already exists
                var existingUserByUsername = _repository.Find(u => u.Username == createDto.Username);
                if (existingUserByUsername != null)
                {
                    return BadRequest("Username already exists. Please choose a different username.");
                }

                // Check if email already exists
                var existingUserByEmail = _repository.Find(u => u.Email == createDto.Email);
                if (existingUserByEmail != null)
                {
                    return BadRequest("Email already exists. Please use a different email address.");
                }

                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = createDto.Username,
                    Email = createDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(createDto.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Create default account for the user
                var defaultAccount = new Account
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    IsMain = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Create required CoreDetails component for the default account
                defaultAccount.CoreDetails = new CoreDetailsComponent
                {
                    Id = Guid.NewGuid(),
                    AccountId = defaultAccount.Id,
                    Name = "Main Account",
                    Balance = 0.00m,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                // Add the default account to the user's accounts collection
                user.Accounts.Add(defaultAccount);

                return CreateEntity(user);
            }
            catch (Exception ex)
            {
                // Handle any other database errors
                if (ex.Message.Contains("UNIQUE constraint failed") || ex.InnerException?.Message.Contains("UNIQUE constraint failed") == true)
                {
                    return BadRequest("Username or email already exists. Please use different values.");
                }
                
                return BadRequest($"An error occurred while creating the user: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public ActionResult<UserReadDTO> UpdateUser(Guid id, [FromBody] UserUpdateDTO updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            return UpdateEntity(updateDto, u => u.Id == id, entity =>
            {
                entity.UpdatedAt = DateTime.UtcNow;
            });
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteUser(Guid id)
        {
            return RemoveEntity(u => u.Id == id);
        }
    }
}
