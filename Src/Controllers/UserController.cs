using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Src.Entities;
using Src.Components;
using Src.Shared.Controller;
using Src.Shared.DTO;
using Src.Shared.Repository;
using Src.Database;
using Src.Repositories;

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

    public class UserTotalBalanceDTO
    {
        public Guid UserId { get; set; }
        public decimal TotalBalance { get; set; }
        public int AccountCount { get; set; }
        public int ActiveAccountCount { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class UserController : AppController<User, UserReadDTO>
    {
        private readonly AppDbContext _context;

        public UserController(IRepository<User, UserReadDTO> repository, AppDbContext context) : base(repository)
        {
            _context = context;
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

                [HttpGet("admin/all")]
        public ActionResult<ListReadDTO<UserReadDTO>> GetAllUsers([FromQuery] PaginateDTO paginate)
        {
            var userRepository = _repository as UserRepository;
            if (userRepository != null)
            {
                var users = userRepository.GetAll(out int total)
                    .Skip(paginate.Skip)
                    .Take(paginate.Limit)
                    .ToList();

                var data = users.Select(userRepository.ParseToRead);
                return Ok(new ListReadDTO<UserReadDTO>
                {
                    Data = data,
                    Total = total,
                });
            }
            return GetEntities(paginate);
        }

        [HttpGet("admin/{id}")]
        public ActionResult<UserReadDTO> GetUserAdmin(Guid id)
        {
            var userRepository = _repository as UserRepository;
            if (userRepository != null)
            {
                var user = userRepository.FindAll(u => u.Id == id);
                if (user == null) return NotFound();
                return Ok(userRepository.ParseToRead(user));
            }
            return FindEntity(u => u.Id == id);
        }

        [HttpPost]
        public ActionResult<UserReadDTO> CreateUser([FromBody] UserCreateDTO createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                                var userRepository = _repository as UserRepository;
                var existingUserByUsername = userRepository?.FindAll(u => u.Username == createDto.Username);
                if (existingUserByUsername != null)
                {
                    return BadRequest("Username already exists. Please choose a different username.");
                }

                                var existingUserByEmail = userRepository?.FindAll(u => u.Email == createDto.Email);
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

                                var defaultAccount = new Account
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    IsMain = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

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

                                user.Accounts.Add(defaultAccount);

                return CreateEntity(user);
            }
            catch (Exception ex)
            {
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

            try
            {
                                var existingUser = _repository.Find(u => u.Id == id);
                if (existingUser == null)
                    return NotFound("User not found");

                var userRepository = _repository as UserRepository;

                                if (!string.IsNullOrEmpty(updateDto.Email) && updateDto.Email != existingUser.Email)
                {
                    var existingUserByEmail = userRepository?.FindAll(u => u.Email == updateDto.Email && u.Id != id);
                    if (existingUserByEmail != null)
                    {
                        return BadRequest("Email already exists. Please use a different email address.");
                    }
                }

                                if (!string.IsNullOrEmpty(updateDto.Username) && updateDto.Username != existingUser.Username)
                {
                    var existingUserByUsername = userRepository?.FindAll(u => u.Username == updateDto.Username && u.Id != id);
                    if (existingUserByUsername != null)
                    {
                        return BadRequest("Username already exists. Please choose a different username.");
                    }
                }

                return UpdateEntity(updateDto, u => u.Id == id, entity =>
                {
                    entity.UpdatedAt = DateTime.UtcNow;
                });
            }
            catch (Exception ex)
            {
                                if (ex.Message.Contains("UNIQUE constraint failed") || ex.InnerException?.Message.Contains("UNIQUE constraint failed") == true)
                {
                    return BadRequest("Username or email already exists. Please use different values.");
                }
                
                return BadRequest($"An error occurred while updating the user: {ex.Message}");
            }
        }

        [HttpGet("{id}/total-balance")]
        public ActionResult<UserTotalBalanceDTO> GetUserTotalBalance(Guid id)
        {
            var user = _context.Users
                .Include(u => u.Accounts)
                    .ThenInclude(a => a.CoreDetails)
                .Where(u => u.Id == id && !u.IsDeleted)
                .FirstOrDefault();

            if (user == null)
                return NotFound("User not found or has been deleted");

            var totalBalance = user.Accounts
                .Where(a => !a.IsDeleted && a.CoreDetails != null)
                .Sum(a => a.CoreDetails.Balance);

            var accountCount = user.Accounts.Count();
            var activeAccountCount = user.Accounts.Count(a => !a.IsDeleted);

            return Ok(new UserTotalBalanceDTO
            {
                UserId = user.Id,
                TotalBalance = totalBalance,
                AccountCount = accountCount,
                ActiveAccountCount = activeAccountCount
            });
        }

        [HttpDelete("{id}")]
        public ActionResult DeleteUser(Guid id)
        {
                        var user = _context.Users
                .Include(u => u.Accounts)
                    .ThenInclude(a => a.CoreDetails)
                .Include(u => u.Accounts)
                    .ThenInclude(a => a.ActiveAccount)
                .Include(u => u.Accounts)
                    .ThenInclude(a => a.SpendingLimit)
                .Include(u => u.Accounts)
                    .ThenInclude(a => a.SavingGoal)
                .Where(u => u.Id == id && !u.IsDeleted)
                .FirstOrDefault();

            if (user == null)
                return NotFound("User not found or has been deleted");

                        var activeAccounts = user.Accounts.Where(a => !a.IsDeleted).ToList();

            if (activeAccounts.Count == 0)
            {
                return BadRequest("User cannot be deleted. No active accounts found.");
            }

                        var totalBalance = activeAccounts
                .Where(a => a.CoreDetails != null)
                .Sum(a => a.CoreDetails.Balance);

            if (totalBalance != 0)
            {
                return BadRequest($"User cannot be deleted. All accounts must have zero balance. Current total balance: {totalBalance:C}");
            }

                        var accountRepository = new AccountRepository(_context);
            var accountController = new AccountController(accountRepository, _context);
            var accountDeletionResult = accountController.DeleteAllAccountsForUser(id);
            
            if (!accountDeletionResult.Success)
            {
                return BadRequest($"Failed to delete user accounts: {accountDeletionResult.ErrorMessage}");
            }
            
                        return RemoveEntity(u => u.Id == id);
        }
    }
}
